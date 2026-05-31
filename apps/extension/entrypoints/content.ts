import type { AnalyzeResponse, JobPosting } from '@ghost/shared';
import { createElement } from 'react';
import { pickAdapter } from '@/src/content/adapters/index.js';
import { EmptyState } from '@/src/content/overlay/EmptyState.js';
import { Overlay } from '@/src/content/overlay/Overlay.js';
import { mountOverlayShadow, type OverlayMount } from '@/src/content/shadow.js';
import { startSoftNavWatcher } from '@/src/content/soft-nav.js';
import type { RpcRequest, RpcResponse } from '@/src/lib/messages.js';

import '@/src/styles/overlay.css';

const SOFT_NAV_DEBOUNCE_MS = 250;

const EXTRACT_TIMEOUT_MS = 25000;

async function extractWithRetry(
  adapter: ReturnType<typeof pickAdapter>,
  doc: Document,
  options: { skipFastPath?: boolean; rejectIfSameAs?: JobPosting | null } = {},
): Promise<JobPosting | null> {
  if (adapter === null) return null;

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

    let dismissed = false;

    let lastPosting: JobPosting | null = null;

    const renderOverlay = (data: AnalyzeResponse | 'empty' | 'error'): void => {
      if (dismissed) return;
      const root = mount.getRoot();
      if (root === null) return;
      const onDismiss = (): void => {
        dismissed = true;
        root.render(null);
      };
      if (data === 'empty') {
        root.render(createElement(EmptyState, { onDismiss }));
      } else if (data === 'error') {
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
      if (ctx.isInvalid) return;
      const adapter = pickAdapter(location.href);
      if (adapter === null) return;
      const posting = await extractWithRetry(adapter, document, {
        skipFastPath: opts.skipFastPath,
        rejectIfSameAs: opts.skipFastPath === true ? lastPosting : null,
      });
      if (posting === null) {
        renderOverlay('empty');
        return;
      }
      lastPosting = posting;
      const request: RpcRequest = { type: 'ANALYZE', payload: posting };
      let response: RpcResponse;
      try {
        response = (await chrome.runtime.sendMessage(request)) as RpcResponse;
      } catch {
        return;
      }
      if (response.ok && 'data' in response) {
        renderOverlay(response.data);
      } else {
        renderOverlay('error');
      }
    };

    await run();

    const stopSoftNavWatcher = startSoftNavWatcher({
      onJobIdChange: () => {
        dismissed = false;
        void run({ skipFastPath: true });
      },
      debounceMs: SOFT_NAV_DEBOUNCE_MS,
    });

    ctx.onInvalidated(stopSoftNavWatcher);
  },
});
