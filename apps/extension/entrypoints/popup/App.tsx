/**
 * Popup App — Phase-4 band-picker + history viewer + Open Options link.
 *
 * UI-SPEC §"Popup" lines 423-446 + §"Copywriting Contract" lines 169-176.
 *
 * Three surfaces (EXT-13 / EXT-15):
 *   - Header: brand chip + wordmark + "Open Options →" link
 *     (chrome.runtime.openOptionsPage() per UI-SPEC line 175).
 *   - Section "Demo: load sample" — D-56 + EXT-15: 4 chips, one per RISK_BANDS
 *     entry. Click sends RpcRequest { type: 'LOAD_DEMO', band } to SW which
 *     looks up DEMO_FIXTURES[band].response and pushes a history entry — zero
 *     network calls (D4 differentiator + Phase-4 demo safety net).
 *   - Section "Recent analyses" — EXT-13: top-5 history rows fetched from SW
 *     via { type: 'GET_HISTORY' } message; "See all (N)" expand when > 5.
 *
 * Tab-detection guard (UI-SPEC line 438 + D-56): when no active LinkedIn/Indeed
 * tab is open, chip click shows a 3-second toast instead of dispatching the
 * LOAD_DEMO — Phase-4 doesn't yet re-render the OVERLAY on the active tab
 * (deferred to Phase 8 polish per Plan 04-08 line 589), but the history-write
 * side effect requires an active job tab to be meaningful.
 *
 * Chip color rule mirrors RiskLabel from Plan 04-07: 12%-alpha tinted bg of
 * RISK_COLORS[band] + BAND_DEEP_TEXT[band] — same source of truth so chip and
 * overlay risk-label stay byte-identical.
 *
 * Security gates (verified by grep acceptance criteria):
 *   - No console.log/warn/error/debug/info anywhere — popup never leaks key/payload.
 *   - No direct chrome.storage.local access — history goes through SW GET_HISTORY.
 *   - No lucide-react import.
 *   - chrome.tabs.query is read-only and not a storage call — gateway invariant intact.
 */

import { useEffect, useState } from 'react';
import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';
import type { RiskBand } from '@ghost/shared';
import { BAND_DEEP_TEXT } from '@/src/content/overlay/labels';
import type { HistoryEntry, RpcResponse } from '@/src/lib/messages';

// Shortened band labels for chips (full "Likely Ghost Job" doesn't fit chip
// width at flex-1 across 4 chips in a 360px popup). Full label rendered in
// `title` attribute as a tooltip per UI-SPEC line 171.
const SHORT_LABEL: Record<RiskBand, string> = {
  legitimate: 'Legitimate',
  caution: 'Caution',
  suspicious: 'Suspicious',
  ghost: 'Ghost',
};

const HISTORY_VISIBLE = 5;

export function App() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Initial load — fetch history from SW. Gateway invariant: never reads
  // chrome.storage.local directly from the popup — SW is the canonical source.
  useEffect(() => {
    void chrome.runtime.sendMessage({ type: 'GET_HISTORY' }).then((res: RpcResponse) => {
      if (res.ok && 'history' in res) setHistory(res.history);
    });
  }, []);

  const showToast = (msg: string): void => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleChipClick = async (band: RiskBand): Promise<void> => {
    // Active-tab guard per UI-SPEC line 438 + D-56: chip click is only meaningful
    // when a LinkedIn or Indeed job tab is active (the overlay re-renders there).
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    // noUncheckedIndexedAccess: tabs[0] is `Tab | undefined` — must guard.
    const activeTab = tabs[0];
    const isJobBoardTab =
      activeTab?.url !== undefined &&
      (activeTab.url.includes('linkedin.com/jobs/') || activeTab.url.includes('indeed.com/'));
    if (!isJobBoardTab) {
      showToast('Open a LinkedIn or Indeed job page first');
      return;
    }
    const res = (await chrome.runtime.sendMessage({
      type: 'LOAD_DEMO',
      band,
    })) as RpcResponse;
    if (res.ok && 'data' in res) {
      // SW already pushed to history; refresh the popup's local copy so the
      // new entry appears at the top of "Recent analyses" without closing/reopening.
      const refreshed = (await chrome.runtime.sendMessage({
        type: 'GET_HISTORY',
      })) as RpcResponse;
      if (refreshed.ok && 'history' in refreshed) setHistory(refreshed.history);
      // Note: the OVERLAY render on the active tab is deferred to Phase 8 polish
      // via a TAB_INVALIDATE / RENDER_DEMO message round-trip (Plan 04-08 line 589).
      // Phase-4 surface: chip click adds a history entry visible in this popup.
    } else {
      showToast('Demo failed — try again');
    }
  };

  const handleOpenOptions = (): void => {
    chrome.runtime.openOptionsPage();
  };

  const visibleHistory = showAllHistory ? history : history.slice(0, HISTORY_VISIBLE);

  return (
    <main className="w-[360px] min-h-[480px] bg-[--color-surface] text-[--color-ink] font-sans p-4 flex flex-col gap-6">
      {/* Header */}
      <header className="h-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GhostLogo />
          <span className="text-xs font-medium">Ghost Job Detector</span>
          <span className="text-xs text-[--color-ink-muted]">v0.1</span>
        </div>
        <button
          type="button"
          onClick={handleOpenOptions}
          className="text-xs font-medium text-[--color-brand] hover:underline focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)] rounded-sm px-1"
        >
          Open Options →
        </button>
      </header>

      {/* Section: Demo: load sample */}
      <section>
        <h2 className="text-sm font-semibold mb-2">Demo: load sample</h2>
        <div className="flex gap-2">
          {RISK_BANDS.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => {
                void handleChipClick(b.key);
              }}
              className="flex-1 h-9 text-sm font-semibold rounded-sm transition-colors duration-100 hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
              style={{
                backgroundColor: `color-mix(in oklch, ${RISK_COLORS[b.key]} 12%, transparent)`,
                color: BAND_DEEP_TEXT[b.key],
              }}
              title={b.label}
            >
              {SHORT_LABEL[b.key]}
            </button>
          ))}
        </div>
        {toast !== null && (
          <div className="mt-2 px-2 py-1 bg-[--color-surface-subtle] rounded-sm text-xs text-[--color-ink-muted]">
            {toast}
          </div>
        )}
      </section>

      {/* Section: Recent analyses */}
      <section className="flex-1">
        <h2 className="text-sm font-semibold mb-2">Recent analyses</h2>
        {visibleHistory.length === 0 ? (
          <p className="text-sm text-[--color-ink-muted] text-center py-4">
            Nothing yet. Visit a LinkedIn or Indeed job, or click a demo chip above.
          </p>
        ) : (
          <ul className="divide-y divide-[--color-border]">
            {visibleHistory.map((entry) => (
              <li key={entry.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block px-2 py-0.5 rounded-sm text-xs font-semibold"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${RISK_COLORS[entry.response.risk]} 12%, transparent)`,
                        color: BAND_DEEP_TEXT[entry.response.risk],
                      }}
                    >
                      {entry.response.score}
                    </span>
                    <span className="text-sm truncate flex-1">
                      {entry.posting.title || '(no title)'}
                    </span>
                  </div>
                  <span className="text-xs text-[--color-ink-muted] whitespace-nowrap">
                    {relativeTime(entry.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {history.length > HISTORY_VISIBLE && !showAllHistory && (
          <button
            type="button"
            onClick={() => setShowAllHistory(true)}
            className="mt-2 text-xs text-[--color-brand] hover:underline focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)] rounded-sm px-1"
          >
            See all ({history.length})
          </button>
        )}
      </section>
    </main>
  );
}

function GhostLogo() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="text-[--color-brand] shrink-0">
      <path
        d="M12 2C7.03 2 3 6.03 3 11v11l3-2.25 3 2.25 3-2.25 3 2.25 3-2.25 3 2.25V11C21 6.03 16.97 2 12 2z"
        fill="currentColor"
      />
      <circle cx="9" cy="11" r="1.5" fill="white" />
      <circle cx="15" cy="11" r="1.5" fill="white" />
    </svg>
  );
}

/**
 * Format a timestamp (ms epoch) as a relative-time string for the history list.
 * UI-SPEC line 174 specifies "12m ago" / "2h ago" / "yesterday" patterns.
 */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}
