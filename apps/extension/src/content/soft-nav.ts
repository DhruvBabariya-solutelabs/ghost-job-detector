/**
 * Soft-nav triple-signal watcher (D-58).
 *
 * LinkedIn's React tree updates the active job WITHOUT a full page reload —
 * a content-script that only fires once on document_idle misses every job
 * after the first. RESEARCH Pitfall 2: relying on any SINGLE signal misses
 * known edge cases. Use all three:
 *
 *   Signal A: MutationObserver on document.body (subtree) → fire()
 *   Signal B: history.pushState/replaceState patch + popstate listener → fire()
 *   Signal C: 200ms-interval URL polling backup → fire()
 *
 * `fire()` debounces 250ms (D-58 default; tunable 200-500ms range) and only
 * invokes the onJobIdChange callback if `currentJobId()` actually changed —
 * dedup via `lastAnalyzedJobId` in module memory.
 *
 * HMR caveat (Pitfall 5): live-reload during dev double-patches history.
 * Accepted dev-loop quirk; reload the host tab fully if soft-nav behavior
 * gets weird. Production-fresh tab only loads the content script once.
 */

export interface SoftNavWatcherOptions {
  onJobIdChange: () => void;
  /** Debounce window in ms. D-58 default = 250; tunable 200-500. */
  debounceMs: number;
}

/**
 * Start watching. Returns an unsubscribe function. Re-running on the same
 * tab without unsubscribing causes double-patching (Pitfall 5).
 */
export function startSoftNavWatcher(opts: SoftNavWatcherOptions): () => void {
  // lastFiredJobId: the job-id we most recently delivered to onJobIdChange.
  // pendingJobId: the latest job-id observed (may still be debouncing).
  // Splitting these two prevents debounce starvation — without it, the
  // MutationObserver (which fires constantly on LinkedIn's chatty DOM)
  // would reset the timer on every mutation and onJobIdChange would never
  // fire while the user is on the page. Now mutations short-circuit unless
  // the URL has actually changed.
  let lastFiredJobId = currentJobId();
  let pendingJobId = lastFiredJobId;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const fire = (): void => {
    const next = currentJobId();
    if (next === pendingJobId) return; // no URL change since last call — ignore mutation noise
    pendingJobId = next;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (pendingJobId !== lastFiredJobId) {
        lastFiredJobId = pendingJobId;
        opts.onJobIdChange();
      }
    }, opts.debounceMs);
  };

  // Signal A: MutationObserver on document.body (subtree+childList).
  // Class names rotate too often to anchor on the job-detail container;
  // body+subtree is louder but the job-id dedup in fire() suppresses noise.
  const observer = new MutationObserver(fire);
  observer.observe(document.body, { childList: true, subtree: true });

  // Signal B: monkey-patch history.pushState + history.replaceState.
  // Save originals to a Symbol so HMR can detect double-patch (defensive
  // only — primary mitigation is reload the host tab during dev).
  const PATCH_SYMBOL = Symbol.for('gjd:original-pushState');
  const win = window as unknown as Record<symbol, unknown>;
  if (win[PATCH_SYMBOL] === undefined) {
    win[PATCH_SYMBOL] = { pushState: history.pushState, replaceState: history.replaceState };
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = function (...args: Parameters<typeof origPush>) {
      const ret = origPush(...args);
      fire();
      return ret;
    };
    history.replaceState = function (...args: Parameters<typeof origReplace>) {
      const ret = origReplace(...args);
      fire();
      return ret;
    };
  }
  window.addEventListener('popstate', fire);

  // Signal C: URL polling backup (catches mutations that don't fire A or B).
  // The early-return inside fire() already short-circuits when URL hasn't
  // changed, so we can just call fire() unconditionally here.
  const poll = setInterval(fire, 200);

  return (): void => {
    observer.disconnect();
    clearInterval(poll);
    window.removeEventListener('popstate', fire);
    if (timer !== null) clearTimeout(timer);
    // NOTE: history.pushState patches are NOT reverted on unsubscribe —
    // content-script unmount on page navigation is the natural cleanup
    // boundary. Multiple subscribe/unsubscribe cycles within one tab
    // accumulate patches; documented Pitfall 5 dev-loop behavior.
  };
}

/**
 * Return a string identifier for the current job, or 'unknown:{pathname}'
 * if no job-id can be extracted. Used for soft-nav dedup AND for the
 * extension's debug logging.
 *
 * - LinkedIn: ?currentJobId={id} OR /jobs/view/{id}
 * - Indeed:   ?vjk={id}          OR ?jk={id}
 */
export function currentJobId(): string {
  const u = new URL(location.href);
  const linkedinSearch = u.searchParams.get('currentJobId');
  if (linkedinSearch !== null && linkedinSearch.length > 0) return `li:${linkedinSearch}`;
  const linkedinView = u.pathname.match(/\/jobs\/view\/(\d+)/);
  if (linkedinView !== null && linkedinView[1] !== undefined) return `li:${linkedinView[1]}`;
  const indeedVjk = u.searchParams.get('vjk');
  if (indeedVjk !== null && indeedVjk.length > 0) return `in:${indeedVjk}`;
  const indeedJk = u.searchParams.get('jk');
  if (indeedJk !== null && indeedJk.length > 0) return `in:${indeedJk}`;
  return `unknown:${u.pathname}`;
}
