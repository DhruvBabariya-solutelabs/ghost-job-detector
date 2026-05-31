'use client';

import type { RiskBand } from '@ghost/shared';
import { DEMO_FIXTURES, RISK_BANDS, RISK_COLORS } from '@ghost/shared';
import { useId, useState } from 'react';
import { ReasonsList } from '@/components/ReasonsList';
import { RiskLabel } from '@/components/RiskLabel';
import { ScoreDial } from '@/components/ScoreDial';
import { SignalBreakdownDrawer } from '@/components/SignalBreakdownDrawer';

const bandFg = (band: RiskBand): string => `var(--color-risk-${band}-fg)`;

const SHORT_LABEL: Record<RiskBand, string> = {
  legitimate: 'Legitimate',
  caution: 'Caution',
  suspicious: 'Suspicious',
  ghost: 'Ghost',
};

function fullLabelFor(band: RiskBand): string {
  for (const b of RISK_BANDS) {
    if (b.key === band) return b.label;
  }
  return 'Unknown';
}

const BAND_ORDER: readonly RiskBand[] = ['legitimate', 'caution', 'suspicious', 'ghost'] as const;

export interface DemoSectionProps {
  compact?: boolean;
}

export function DemoSection({ compact = false }: DemoSectionProps = {}) {
  const [activeBand, setActiveBand] = useState<RiskBand>('legitimate');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();

  let fixture = DEMO_FIXTURES[0];
  for (const f of DEMO_FIXTURES) {
    if (f.band === activeBand) {
      fixture = f;
      break;
    }
  }
  if (fixture === undefined) {
    throw new Error(`DEMO_FIXTURES missing band ${activeBand}`);
  }

  const { score, risk, reasons, signalBreakdown } = fixture.response;
  const fullLabel = fullLabelFor(activeBand);

  return (
    <section
      className={
        compact
          ? 'w-full flex flex-col items-center gap-5'
          : 'w-full max-w-[720px] mx-auto flex flex-col items-center gap-6'
      }
      id="demo"
    >
      {!compact && (
        <>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[--color-ink] text-center">
            Try it — pick a band.
          </h2>
          <p className="text-base md:text-lg text-[--color-ink-muted] text-center max-w-[600px]">
            Each button loads a hand-picked posting from that risk band. The dial above re-animates
            against the new fixture.
          </p>
        </>
      )}

      <span className="sr-only" aria-live="polite">
        Loaded {fullLabel} sample. Score: {score} out of 100.
      </span>

      <ScoreDial
        score={score}
        risk={risk}
        size={160}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
        drawerId={drawerId}
      />

      <RiskLabel band={risk} />
      <p className="text-sm text-[--color-ink-muted]">
        {fullLabel} · score {score}/100
      </p>

      <div className="flex gap-2 w-full">
        {BAND_ORDER.map((band) => {
          const isActive = activeBand === band;
          return (
            <button
              key={band}
              type="button"
              onClick={() => setActiveBand(band)}
              aria-pressed={isActive}
              title={fullLabelFor(band)}
              className={[
                'flex-1 h-10 px-3',
                'text-sm font-semibold rounded-md',
                'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0',
                'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[--color-border-focus]/40',
                isActive
                  ? 'ring-1 ring-inset shadow-[0_1px_0_0_oklch(1_0_0/0.06)_inset]'
                  : 'ring-1 ring-inset ring-transparent',
              ].join(' ')}
              style={{
                backgroundColor: `color-mix(in oklch, ${RISK_COLORS[band]} ${isActive ? 28 : 14}%, transparent)`,
                color: bandFg(band),
                ...(isActive
                  ? {
                      boxShadow: `inset 0 0 0 1px ${RISK_COLORS[band]}66, 0 0 24px -8px ${RISK_COLORS[band]}55`,
                    }
                  : {}),
              }}
            >
              {SHORT_LABEL[band]}
            </button>
          );
        })}
      </div>

      <div className="w-full">
        <ReasonsList reasons={reasons} />
      </div>

      <div className="w-full">
        <SignalBreakdownDrawer
          breakdown={signalBreakdown}
          open={drawerOpen}
          band={risk}
          drawerId={drawerId}
        />
      </div>
    </section>
  );
}
