export interface SoftNavWatcherOptions {
  onJobIdChange: () => void;
  debounceMs: number;
}

export function startSoftNavWatcher(opts: SoftNavWatcherOptions): () => void {
  let lastFiredJobId = currentJobId();
  let pendingJobId = lastFiredJobId;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const fire = (): void => {
    const next = currentJobId();
    if (next === pendingJobId) return;
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

  const observer = new MutationObserver(fire);
  observer.observe(document.body, { childList: true, subtree: true });

  const PATCH_SYMBOL = Symbol.for('gjd:original-pushState');
  const win = window as unknown as Record<symbol, unknown>;
  if (win[PATCH_SYMBOL] === undefined) {
    win[PATCH_SYMBOL] = { pushState: history.pushState, replaceState: history.replaceState };
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<typeof origPush>) => {
      const ret = origPush(...args);
      fire();
      return ret;
    };
    history.replaceState = (...args: Parameters<typeof origReplace>) => {
      const ret = origReplace(...args);
      fire();
      return ret;
    };
  }
  window.addEventListener('popstate', fire);

  const poll = setInterval(fire, 200);

  return (): void => {
    observer.disconnect();
    clearInterval(poll);
    window.removeEventListener('popstate', fire);
    if (timer !== null) clearTimeout(timer);
  };
}

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
