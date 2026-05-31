import type { AnalyzeResponse, RiskBand } from '@ghost/shared';
import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';
import { useId, useState } from 'react';
import { VERDICT_LINES } from './labels.js';
import { OverlayHeader } from './OverlayHeader.js';
import { ReasonsList } from './ReasonsList.js';
import { RiskLabel } from './RiskLabel.js';
import { ScoreDial } from './ScoreDial.js';
import { SignalBreakdownDrawer } from './SignalBreakdownDrawer.js';

export interface OverlayProps {
  response: AnalyzeResponse;
  onDismiss: () => void;
}

export function Overlay({ response, onDismiss }: OverlayProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();

  const accent = RISK_COLORS[response.risk];
  const lightAccent = `color-mix(in oklch, ${accent} 55%, white)`;

  return (
    <div
      className="gjd-ov-card fixed top-4 right-4 w-[400px] flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden font-sans z-[2147483647]"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      <div
        aria-hidden="true"
        className="shrink-0"
        style={{ height: 3, backgroundImage: `linear-gradient(90deg, ${lightAccent}, ${accent})` }}
      />

      <OverlayHeader onDismiss={onDismiss} />

      <span className="sr-only" aria-live="polite">
        Trust score: {response.score} out of 100. Verdict: {bandLabelFor(response.risk)}.
      </span>

      <div className="px-5 pt-5 pb-4 flex flex-col items-center shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--ov-ink-muted) mb-1">
          Trust Score
        </span>
        <ScoreDial
          score={response.score}
          risk={response.risk}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen((o) => !o)}
          drawerId={drawerId}
        />
        <RiskLabel band={response.risk} />
        <p className="mt-2 text-[12px] leading-snug text-(--ov-ink-soft) text-center max-w-[232px]">
          {VERDICT_LINES[response.risk]}
        </p>
      </div>

      <div className="gjd-ov-scroll px-5 pb-5 grow min-h-0 overflow-y-auto">
        <ReasonsList reasons={response.reasons} band={response.risk} />
      </div>

      <SignalBreakdownDrawer
        breakdown={response.signalBreakdown}
        open={drawerOpen}
        band={response.risk}
        drawerId={drawerId}
      />
    </div>
  );
}

function bandLabelFor(risk: RiskBand): string {
  for (const band of RISK_BANDS) {
    if (band.key === risk) return band.label;
  }
  return 'Unknown';
}
