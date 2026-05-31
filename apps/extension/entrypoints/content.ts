/**
 * Content script orchestrator — Phase 4.
 *
 * Lifecycle:
 *  1. defineContentScript matches: linkedin.com/jobs/* + indeed.com/* + run_at: document_idle
 *  2. mountOverlayShadow() — closed shadow root + cssInjectionMode: 'ui' (overlay.css)
 *  3. pickAdapter(location.href) — null if URL is outside our handled set; bail
 *  4. extractWithRetry — MutationObserver-based wait for first-load hydration
 *     race (Pitfall 2). Resolves instantly when the DOM is ready; bounded by
 *     EXTRACT_TIMEOUT_MS soft ceiling so a truly broken page eventually shows
 *     the empty state (D-60) rather than waiting forever.
 *  5. dispatch ANALYZE to SW (or render empty-state if extract returned null)
 *  6. startSoftNavWatcher — on every job-id change, re-run extract + dispatch
 *
 * Plan 04-07 plugs the React overlay tree into the `renderOverlay` callback.
 */

import { createElement } from 'react';

import { pickAdapter } from '@/src/content/adapters/index.js';
import { mountOverlayShadow, type OverlayMount } from '@/src/content/shadow.js';
import { startSoftNavWatcher } from '@/src/content/soft-nav.js';
import { Overlay } from '@/src/content/overlay/Overlay.js';
import { EmptyState } from '@/src/content/overlay/EmptyState.js';
import type { JobPosting, AnalyzeResponse } from '@ghost/shared';
import type { RpcRequest, RpcResponse } from '@/src/lib/messages.js';

import '@/src/styles/overlay.css';

/** D-58 default debounce. Tunable 200-500ms per the locked range. */
const SOFT_NAV_DEBOUNCE_MS = 250;

/**
 * D-60 + Pitfall 2: soft ceiling for the MutationObserver-based extract wait.
 *
 * LinkedIn's `/jobs/collections/` view hydrates the right-side panel via a
 * `/preload/` iframe shell that's swapped inline AFTER document_idle. On
 * slow connections this swap can take 8-15s. 25s gives comfortable headroom
 * while still bounding the wait for genuinely broken pages — a user with a
 * working page sees the overlay the instant the DOM is ready (MutationObserver
 * resolves on the first qualifying mutation batch, not on a poll tick).
 */
const EXTRACT_TIMEOUT_MS = 25000;

/**
 * Wait for the adapter to produce a non-null JobPosting using a hybrid:
 *
 *  1. Synchronous fast path (skipped on soft-nav): try `adapter.extract(doc)`
 *     once. Direct `/jobs/view/` pages and cached collection panels resolve
 *     here. **Disabled on soft-nav** — when LinkedIn flips currentJobId, the
 *     right-panel DOM hasn't swapped yet, so a sync read returns the previous
 *     job's content (stale-DOM race).
 *  2. MutationObserver wait: attach a body subtree observer. Re-run
 *     `adapter.extract(doc)` on each mutation batch. Reject extracts whose
 *     title+description match `rejectIfSameAs` (catches noise mutations that
 *     fire before LinkedIn swaps the panel). Resolve as soon as a fresh
 *     posting appears; disconnect the observer on success.
 *  3. Soft fallback ceiling: after EXTRACT_TIMEOUT_MS, disconnect and
 *     resolve null so D-60 EmptyState can render on truly broken pages.
 */
async function extractWithRetry(
  adapter: ReturnType<typeof pickAdapter>,
  doc: Document,
  options: { skipFastPath?: boolean; rejectIfSameAs?: JobPosting | null } = {}
): Promise<JobPosting | null> {
  if (adapter === null) return null;

  // Synchronous fast path — direct /jobs/view/ pages resolve here.
  // Skipped on soft-nav: the URL flips before LinkedIn swaps the right panel,
  // so a sync read would return the previous job's content.
  if (options.skipFastPath !== true) {
    const initial = adapter.extract(doc);
    if (initial !== null) return initial;
  }

  const stale = options.rejectIfSameAs ?? null;
  const isStale = (p: JobPosting): boolean =>
    stale !== null && p.title === stale.title && p.description === stale.description;

  return new Promise<JobPosting | null>((resolve) => {
    let settled = false;
    const settle = (value: JobPosting | null): void => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timeoutId);
      resolve(value);
    };

    const observer = new MutationObserver(() => {
      const posting = adapter.extract(doc);
      if (posting !== null && !isStale(posting)) settle(posting);
    });
    observer.observe(doc.body, { childList: true, subtree: true });

    const timeoutId = setTimeout(() => settle(null), EXTRACT_TIMEOUT_MS);
  });
}

export default defineContentScript({
  matches: ['https://*.linkedin.com/jobs/*', 'https://*.indeed.com/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx: InstanceType<typeof ContentScriptContext>): Promise<void> {
    const mount: OverlayMount = await mountOverlayShadow(ctx);

    // Per-tab/per-session dismiss flag (D-47) — module-memory closure,
    // NEVER chrome.storage. The flag resets to false on every soft-nav
    // (job-id change) so the next job re-mounts a fresh overlay.
    let dismissed = false;

    // Most-recent posting analyzed in this tab. Used to reject stale-DOM
    // re-extractions on soft-nav (LinkedIn flips the URL before swapping the
    // right panel; the first mutation batch can re-yield the previous job's
    // content). Kept in closure memory — never persisted.
    let lastPosting: JobPosting | null = null;

    const renderOverlay = (data: AnalyzeResponse | 'empty' | 'error'): void => {
      if (dismissed) return; // D-47 — respect the per-tab dismissal
      const root = mount.getRoot();
      if (root === null) return; // shadow root unmounted
      const onDismiss = (): void => {
        dismissed = true;
        // Unmount the React tree but keep the shadow root attached — the next
        // soft-nav re-runs through this same render path with the dismissed
        // flag reset to false, re-using the existing shadow host.
        root.render(null);
      };
      if (data === 'empty') {
        root.render(createElement(EmptyState, { onDismiss }));
      } else if (data === 'error') {
        // SW fetch failure — show distinct error copy + Retry button (Phase 7)
        // onRetry resets the dismiss flag and re-runs the full pipeline so
        // stale-DOM and transient network failures both recover (T-07-02).
        const onRetry = (): void => {
          dismissed = false;
          void run();
        };
        root.render(createElement(EmptyState, { onDismiss, isNetworkError: true, onRetry }));
      } else {
        root.render(createElement(Overlay, { response: data, onDismiss }));
      }
    };

    const run = async (opts: { skipFastPath?: boolean } = {}): Promise<void> => {
      // A content script outlives its extension when the extension is reloaded
      // or auto-updated: the old script keeps running on the page but its
      // chrome.runtime is dead, so any chrome.* call throws "Extension context
      // invalidated". Bail before doing any work once the context is gone.
      if (ctx.isInvalid) return;
      const adapter = pickAdapter(location.href);
      if (adapter === null) return; // URL outside our handled set — no overlay
      const posting = await extractWithRetry(adapter, document, {
        skipFastPath: opts.skipFastPath,
        rejectIfSameAs: opts.skipFastPath === true ? lastPosting : null,
      });
      if (posting === null) {
        // D-60 empty state — render the EmptyState shell
        renderOverlay('empty');
        return;
      }
      lastPosting = posting;
      // SW dispatch — ALL fetches go through background.ts (PITFALLS Cross-Origin Fetches)
      const request: RpcRequest = { type: 'ANALYZE', payload: posting };
      let response: RpcResponse;
      try {
        response = (await chrome.runtime.sendMessage(request)) as RpcResponse;
      } catch {
        // The context can invalidate between the guard above and this call
        // (extension reload/update mid-flight), making sendMessage throw or
        // reject with "Extension context invalidated". Nothing is actionable
        // from a dead context — stop silently; the next page load injects a
        // fresh script that re-runs the pipeline.
        return;
      }
      if (response.ok && 'data' in response) {
        renderOverlay(response.data);
      } else {
        // SW returned an error (network failure, API error, etc.) — render the
        // distinct network-error state with a Retry button (Phase 7 requirement).
        renderOverlay('error');
      }
    };

    await run();

    const stopSoftNavWatcher = startSoftNavWatcher({
      onJobIdChange: () => {
        // D-47 — soft-nav unsticks the per-tab dismiss so the next job
        // re-mounts a fresh overlay. skipFastPath avoids reading the
        // pre-swap DOM (stale-DOM race); rejectIfSameAs guards against
        // mutation noise re-yielding the previous posting.
        dismissed = false;
        void run({ skipFastPath: true });
      },
      debounceMs: SOFT_NAV_DEBOUNCE_MS,
    });

    // Tear the watcher down when the extension context is invalidated (reload /
    // update). Otherwise its MutationObserver + 200ms poll keep firing on a dead
    // context and every onJobIdChange would hit the now-guarded run() forever.
    ctx.onInvalidated(stopSoftNavWatcher);
  },
});
