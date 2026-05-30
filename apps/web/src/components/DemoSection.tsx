'use client';

/**
 * DemoSection (web) — HERO H5 interactive sample demo.
 *
 * The landing page has ONE ScoreDial (UI-SPEC line 256). DemoSection owns the
 * activeBand state, renders the 160×160 hero dial, the 4 band-tinted buttons,
 * the RiskLabel + caption, the ReasonsList, and the collapsible
 * SignalBreakdownDrawer — all composed into a single client-component subtree
 * embedded inside the Hero block (Plan 05-05).
 *
 * Initial state per CONTEXT D-63: Legitimate fixture loaded on first paint.
 * Score is whatever DEMO_FIXTURES['legitimate'].response.score returns (Phase 4
 * baked this at 87). The dial WAAPI-reveals from 0 → 87 over 700ms on mount.
 *
 * Click handlers on the 4 band buttons set `activeBand` → the new fixture's
 * `score` flows into ScoreDial → ScoreDial's `useEffect([score, size])` re-runs
 * the WAAPI animation against the new target offset (Plan 05-01 contract). The
 * RiskLabel + caption + ReasonsList + drawer all re-render against the new
 * fixture in the same React commit.
 *
 * Iteration rule (UI-SPEC §"4-band visual key" lines 214 + 519): button labels
 * use the SHORT_LABEL form ('Legitimate' / 'Caution' / 'Suspicious' / 'Ghost' —
 * shortened from 'Likely Ghost Job') while the title attribute carries the full
 * RISK_BANDS label. ARIA-live announcement uses the full label too.
 */

import { useId, useState } from 'react';
import type { RiskBand } from '@ghost/shared';
import { DEMO_FIXTURES, RISK_BANDS, RISK_COLORS } from '@ghost/shared';
import { ScoreDial } from '@/components/ScoreDial';
import { RiskLabel } from '@/components/RiskLabel';
import { ReasonsList } from '@/components/ReasonsList';
import { SignalBreakdownDrawer } from '@/components/SignalBreakdownDrawer';

// Dark-mode band foreground vars — defined in apps/web globals.css. These are
// lightness-tuned brighter variants of BAND_DEEP_TEXT for proper contrast on
// the dark surface; the extension still uses BAND_DEEP_TEXT on its light overlay.
const bandFg = (band: RiskBand): string => `var(--color-risk-${band}-fg)`;

const SHORT_LABEL: Record<RiskBand, string> = {
  legitimate: 'Legitimate',
  caution: 'Caution',
  suspicious: 'Suspicious',
  ghost: 'Ghost',
};

// for..of over RISK_BANDS — same precedent as risk.ts:39-44 and RiskLabel.tsx.
// Never use .find() (returns T | undefined under noUncheckedIndexedAccess).
function fullLabelFor(band: RiskBand): string {
  for (const b of RISK_BANDS) {
    if (b.key === band) return b.label;
  }
  return 'Unknown';
}

const BAND_ORDER: readonly RiskBand[] = [
  'legitimate',
  'caution',
  'suspicious',
  'ghost',
] as const;

export interface DemoSectionProps {
  /**
   * When true, the inner H2 and sub-paragraph are suppressed because the
   * surrounding context (Hero) already provides the heading framing. Defaults
   * to false so anchor links and standalone use are unaffected.
   */
  compact?: boolean;
}

export function DemoSection({ compact = false }: DemoSectionProps = {}) {
  const [activeBand, setActiveBand] = useState<RiskBand>('legitimate');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();

  // for..of over DEMO_FIXTURES — never .find() (Pitfall 2 / noUncheckedIndexedAccess).
  let fixture = DEMO_FIXTURES[0];
  for (const f of DEMO_FIXTURES) {
    if (f.band === activeBand) {
      fixture = f;
      break;
    }
  }
  // Defensive — DEMO_FIXTURES always carries the 4 bands; this guard is a
  // programming-error tripwire.
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
            Each button loads a hand-picked posting from that risk band. The
            dial above re-animates against the new fixture.
          </p>
        </>
      )}

      {/* sr-only aria-live announcement — fires on every activeBand change */}
      <span className="sr-only" aria-live="polite">
        Loaded {fullLabel} sample. Score: {score} out of 100.
      </span>

      {/* The ONE ScoreDial on the page — re-animates on band-button click
          because [score, size] is the dep array in ScoreDial.useEffect. */}
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

      {/* 4 demo buttons — flex-1 for equal width, gap-2 inter-button */}
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
                  ? { boxShadow: `inset 0 0 0 1px ${RISK_COLORS[band]}66, 0 0 24px -8px ${RISK_COLORS[band]}55` }
                  : {}),
              }}
            >
              {SHORT_LABEL[band]}
            </button>
          );
        })}
      </div>

      {/* Reasons for the active fixture */}
      <div className="w-full">
        <ReasonsList reasons={reasons} />
      </div>

      {/* Collapsible signal-breakdown drawer */}
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
