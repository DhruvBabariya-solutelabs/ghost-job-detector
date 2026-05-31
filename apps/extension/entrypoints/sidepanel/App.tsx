import type { RiskBand } from '@ghost/shared';
import { useState } from 'react';
import { Brand } from '@/src/ui/Brand';
import { GhostsDodged } from '@/src/ui/GhostsDodged';
import { HistoryList } from '@/src/ui/HistoryList';
import { IconButton } from '@/src/ui/IconButton';
import { SettingsIcon, ShareIcon } from '@/src/ui/icons';
import { ResultHero } from '@/src/ui/ResultHero';
import { SampleChips } from '@/src/ui/SampleChips';
import { ShareCard } from '@/src/ui/ShareCard';
import { SignalList } from '@/src/ui/SignalList';
import { EmptyState } from '@/src/ui/states/EmptyState';
import { ErrorState } from '@/src/ui/states/ErrorState';
import { LoadingState } from '@/src/ui/states/LoadingState';
import { OfflineBanner } from '@/src/ui/states/OfflineState';
import { ThemeToggle } from '@/src/ui/ThemeToggle';
import { useGhostUi } from '@/src/ui/useGhostUi';
import { useReducedMotion } from '@/src/ui/useReducedMotion';
import { VERDICTS, verdictVars } from '@/src/ui/verdict';

const SectionLabel = ({ children }: { children: string }) => (
  <h3
    style={{
      margin: '0 0 10px',
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

  const result =
    ui.selected && (ui.status === 'result' || ui.status === 'onboarding') ? ui.selected : null;
  const showResult = result !== null && ui.status !== 'loading' && ui.status !== 'error';
  const vVars = showResult && result ? verdictVars(VERDICTS[result.response.risk]) : {};
  const pick = (band: RiskBand): void => void ui.loadDemo(band);

  return (
    <main
      className="gjd-canvas"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        ...vVars,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(12px)',
          background: 'color-mix(in oklab, var(--bg) 78%, transparent)',
        }}
      >
        <Brand size={22} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GhostsDodged value={ui.ghostsDodged} />
          <ThemeToggle />
          <IconButton label="Settings & API key" onClick={() => chrome.runtime.openOptionsPage()}>
            <SettingsIcon size={16} />
          </IconButton>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: sharing ? 'hidden' : 'auto',
          overflowX: 'hidden',
          padding: 22,
        }}
      >
        {!ui.online && (
          <div style={{ marginBottom: 16, maxWidth: 720 }}>
            <OfflineBanner />
          </div>
        )}

        {ui.status === 'loading' && (
          <div style={{ maxWidth: 420, margin: '40px auto' }}>
            <LoadingState size={240} />
          </div>
        )}

        {ui.status === 'error' && (
          <div style={{ maxWidth: 420, margin: '60px auto' }}>
            <ErrorState onRetry={() => void ui.retry()} />
          </div>
        )}

        {(ui.status === 'empty' || (!showResult && ui.status === 'onboarding')) && (
          <div className="gjd-panes">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <EmptyState />
              <section>
                <SectionLabel>Try a sample</SectionLabel>
                <SampleChips onPick={pick} columns={2} />
              </section>
            </div>
            <section className="gjd-card" style={{ padding: 20 }}>
              <SectionLabel>Recent scans</SectionLabel>
              <HistoryList
                entries={ui.history}
                selectedId={null}
                onSelect={ui.selectEntry}
                limit={Number.POSITIVE_INFINITY}
              />
            </section>
          </div>
        )}

        {showResult && result && (
          <div className="gjd-panes">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="gjd-card" style={{ padding: '24px 20px' }}>
                <ResultHero
                  entry={result}
                  animate={ui.justRevealed}
                  reducedMotion={reduced}
                  gaugeSize={220}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: 18,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSharing(true)}
                    className="gjd-focus gjd-chip"
                    style={{
                      all: 'unset',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 18px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                      fontWeight: 600,
                      fontSize: 'var(--t-sm)',
                      cursor: 'pointer',
                      zIndex: 1,
                    }}
                  >
                    <ShareIcon size={15} style={{ color: 'var(--brand)' }} />
                    Share verdict
                  </button>
                </div>
              </div>

              <section>
                <SectionLabel>Try a sample</SectionLabel>
                <SampleChips onPick={pick} columns={2} />
              </section>

              <section>
                <SectionLabel>Scan history</SectionLabel>
                <HistoryList
                  entries={ui.history}
                  selectedId={result.id}
                  onSelect={ui.selectEntry}
                  limit={Number.POSITIVE_INFINITY}
                />
              </section>
            </div>

            <div className="gjd-card" style={{ padding: 22 }}>
              <SignalList
                reasons={result.response.reasons}
                band={result.response.risk}
                animate={ui.justRevealed}
                reducedMotion={reduced}
              />
            </div>
          </div>
        )}
      </div>

      {sharing && result && <ShareCard entry={result} onClose={() => setSharing(false)} />}
    </main>
  );
}
