/**
 * Popup — 380px premium redesign.
 *
 * One surface, five states (onboarding / loading / result / empty / error)
 * crossfaded around a persistent gauge anchor. The most-recent analysis is the
 * hero; samples trigger the full reveal; history lets you revisit past scans;
 * the verdict recolours the whole popup's ambient gradient + accents.
 *
 * Keeps all prior functionality: demo samples (LOAD_DEMO), scan history
 * (GET_HISTORY), and the Options link. Adds: animated gauge hero, signal cards,
 * onboarding, theme toggle, ghosts-dodged counter, shareable card, and a
 * one-tap expand into the side-panel.
 *
 * Security gates preserved: no console.*, no lucide-react, no direct
 * chrome.storage.local writes of the BYOK key (UI prefs go through the gateway).
 */

import { useState } from 'react';
import type { RiskBand } from '@ghost/shared';
import { setOnboarded } from '@/src/lib/storage';
import { useGhostUi } from '@/src/ui/useGhostUi';
import { useReducedMotion } from '@/src/ui/useReducedMotion';
import { verdictVars, VERDICTS } from '@/src/ui/verdict';
import { Brand } from '@/src/ui/Brand';
import { ThemeToggle } from '@/src/ui/ThemeToggle';
import { IconButton } from '@/src/ui/IconButton';
import { GhostsDodged } from '@/src/ui/GhostsDodged';
import { SettingsIcon, ExpandIcon, ShareIcon } from '@/src/ui/icons';
import { ResultHero } from '@/src/ui/ResultHero';
import { SignalList } from '@/src/ui/SignalList';
import { SampleChips } from '@/src/ui/SampleChips';
import { HistoryList } from '@/src/ui/HistoryList';
import { Onboarding } from '@/src/ui/Onboarding';
import { ShareCard } from '@/src/ui/ShareCard';
import { LoadingState } from '@/src/ui/states/LoadingState';
import { EmptyState } from '@/src/ui/states/EmptyState';
import { ErrorState } from '@/src/ui/states/ErrorState';
import { OfflineBanner } from '@/src/ui/states/OfflineState';

const SectionLabel = ({ children }: { children: string }) => (
  <h3
    style={{
      margin: '0 0 8px',
      fontSize: 'var(--t-2xs)',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--ink-muted)',
    }}
  >
    {children}
  </h3>
);

export function App() {
  const ui = useGhostUi();
  const reduced = useReducedMotion();
  const [sharing, setSharing] = useState(false);

  const result = ui.status === 'result' && ui.selected ? ui.selected : null;
  const vVars = result ? verdictVars(VERDICTS[result.response.risk]) : {};

  const openOptions = (): void => {
    void chrome.runtime.openOptionsPage();
  };

  const expandToSidePanel = (): void => {
    if (!chrome.sidePanel) return;
    void chrome.windows.getCurrent().then((win) => {
      if (typeof win.id === 'number') {
        void chrome.sidePanel.open({ windowId: win.id }).then(() => window.close());
      }
    });
  };

  const pick = (band: RiskBand): void => {
    void ui.loadDemo(band);
  };

  const finishOnboarding = (): void => {
    void setOnboarded();
    void ui.loadDemo('legitimate');
  };

  return (
    <main
      className="gjd-canvas"
      style={{
        width: 380,
        minHeight: 480,
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...vVars,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <Brand size={20} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {chrome.sidePanel && (
            <IconButton label="Open in side panel" onClick={expandToSidePanel}>
              <ExpandIcon size={16} />
            </IconButton>
          )}
          <ThemeToggle />
          <IconButton label="Settings & API key" onClick={openOptions}>
            <SettingsIcon size={16} />
          </IconButton>
        </div>
      </header>

      {/* Scroll body */}
      <div
        style={{
          flex: 1,
          overflowY: sharing ? 'hidden' : 'auto',
          overflowX: 'hidden',
          padding: 16,
        }}
      >
        {!ui.online && ui.status !== 'onboarding' && (
          <div style={{ marginBottom: 14 }}>
            <OfflineBanner />
          </div>
        )}

        {ui.status === 'onboarding' && (
          <div style={{ height: 440 }}>
            <Onboarding onFinish={finishOnboarding} onSkip={ui.finishOnboarding} />
          </div>
        )}

        {ui.status === 'loading' && (
          <div style={{ paddingTop: 12 }}>
            <LoadingState />
          </div>
        )}

        {ui.status === 'error' && (
          <div style={{ paddingTop: 40 }}>
            <ErrorState onRetry={() => void ui.retry()} />
          </div>
        )}

        {ui.status === 'empty' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 12 }}>
            <EmptyState />
            <section>
              <SectionLabel>Try a sample</SectionLabel>
              <SampleChips onPick={pick} columns={2} />
            </section>
            {ui.history.length > 0 && (
              <section>
                <SectionLabel>Recent scans</SectionLabel>
                <HistoryList
                  entries={ui.history}
                  selectedId={null}
                  onSelect={ui.selectEntry}
                  limit={4}
                />
              </section>
            )}
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <ResultHero
              entry={result}
              animate={ui.justRevealed}
              reducedMotion={reduced}
              gaugeSize={196}
            />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setSharing(true)}
                className="gjd-focus gjd-chip"
                style={{
                  all: 'unset',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  fontSize: 'var(--t-sm)',
                  cursor: 'pointer',
                }}
              >
                <ShareIcon size={15} style={{ color: 'var(--brand)' }} />
                Share verdict
              </button>
            </div>

            <SignalList
              reasons={result.response.reasons}
              band={result.response.risk}
              animate={ui.justRevealed}
              reducedMotion={reduced}
            />

            <section>
              <SectionLabel>Try another sample</SectionLabel>
              <SampleChips onPick={pick} columns={2} />
            </section>

            <section>
              <SectionLabel>Recent scans</SectionLabel>
              <HistoryList
                entries={ui.history}
                selectedId={result.id}
                onSelect={ui.selectEntry}
                limit={4}
              />
            </section>
          </div>
        )}
      </div>

      {/* Footer: ghosts-dodged */}
      {ui.status !== 'onboarding' && (
        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <GhostsDodged value={ui.ghostsDodged} />
          <span style={{ fontSize: 'var(--t-2xs)', color: 'var(--ink-faint)' }}>
            BYOK · private by design
          </span>
        </footer>
      )}

      {sharing && result && <ShareCard entry={result} onClose={() => setSharing(false)} />}
    </main>
  );
}
