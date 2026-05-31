import type { RiskBand } from '@ghost/shared';
import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry, RpcResponse } from '@/src/lib/messages';
import { getGhostsDodged, getOnboarded, setOnboarded } from '@/src/lib/storage';

export type Surface = 'popup' | 'sidepanel';

export type UiStatus = 'onboarding' | 'empty' | 'loading' | 'result' | 'error';

export interface GhostUi {
  status: UiStatus;
  history: HistoryEntry[];
  selected: HistoryEntry | null;
  ghostsDodged: number;
  online: boolean;
  justRevealed: boolean;
  loadDemo: (band: RiskBand) => Promise<void>;
  retry: () => Promise<void>;
  selectEntry: (entry: HistoryEntry) => void;
  finishOnboarding: () => void;
  refresh: () => Promise<HistoryEntry[]>;
}

async function send(msg: { type: string; band?: RiskBand }): Promise<RpcResponse> {
  return (await chrome.runtime.sendMessage(msg)) as RpcResponse;
}

export function useGhostUi(): GhostUi {
  const [status, setStatus] = useState<UiStatus>('empty');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [ghostsDodged, setGhostsDodged] = useState(0);
  const [online, setOnline] = useState<boolean>(() => navigator.onLine);
  const [justRevealed, setJustRevealed] = useState(false);
  const [lastBand, setLastBand] = useState<RiskBand | null>(null);

  const refresh = useCallback(async () => {
    const [res, dodged] = await Promise.all([send({ type: 'GET_HISTORY' }), getGhostsDodged()]);
    setGhostsDodged(dodged);
    if (res.ok && 'history' in res) {
      setHistory(res.history);
      return res.history;
    }
    return [] as HistoryEntry[];
  }, []);

  useEffect(() => {
    void (async () => {
      const [onboarded, hist] = await Promise.all([getOnboarded(), refresh()]);
      if (!onboarded) {
        setStatus('onboarding');
        return;
      }
      if (hist.length > 0) {
        setSelected(hist[0] ?? null);
        setStatus('result');
      } else {
        setStatus('empty');
      }
    })();
  }, [refresh]);

  useEffect(() => {
    const up = (): void => setOnline(true);
    const down = (): void => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const loadDemo = useCallback(
    async (band: RiskBand) => {
      setLastBand(band);
      setJustRevealed(false);
      setStatus('loading');
      const [res] = await Promise.all([
        send({ type: 'LOAD_DEMO', band }),
        new Promise((r) => setTimeout(r, 720)),
      ]);
      if (res.ok && 'data' in res) {
        const hist = await refresh();
        setSelected(hist[0] ?? null);
        setJustRevealed(true);
        setStatus('result');
      } else {
        setStatus('error');
      }
    },
    [refresh],
  );

  const retry = useCallback(async () => {
    if (lastBand) await loadDemo(lastBand);
    else await refresh();
  }, [lastBand, loadDemo, refresh]);

  const selectEntry = useCallback((entry: HistoryEntry) => {
    setJustRevealed(false);
    setSelected(entry);
    setStatus('result');
  }, []);

  const finishOnboarding = useCallback(() => {
    void setOnboarded();
    setStatus(history.length > 0 ? 'result' : 'empty');
    if (history.length > 0) setSelected(history[0] ?? null);
  }, [history]);

  return {
    status,
    history,
    selected,
    ghostsDodged,
    online,
    justRevealed,
    loadDemo,
    retry,
    selectEntry,
    finishOnboarding,
    refresh,
  };
}
