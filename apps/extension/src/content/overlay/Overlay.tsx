/**
 * Overlay — the root React tree composing the hero surface.
 *
 * Composition (Hero Score redesign):
 *   - OverlayHeader (ghost icon + Heuristics pill + X-dismiss)
 *   - Score block: band-tinted radial backdrop, "TRUST SCORE" eyebrow,
 *                  ScoreDial, RiskLabel — read as one composed group
 *   - ReasonsList ("Why this score")
 *   - SignalBreakdownDrawer (positioned outside the inner padded block so its
 *     max-height transition is clipped by the overlay's overflow-hidden)
 *
 * The score-dial IS the drawer toggle (UI-SPEC line 293) — clicking the dial
 * flips drawerOpen. A useId() generates the aria-controls/id link between the
 * dial-as-button and the collapsible <section>.
 *
 * Aria-live announcement (UI-SPEC §"Copywriting" + §"Accessibility"):
 * a visually-hidden span announces "Trust score: {N} out of 100. Verdict:
 * {bandLabel}." on render — re-announces on every soft-nav re-extraction
 * because content.ts calls root.render(...) which mounts a fresh tree.
 *
 * bandLabelFor iterates RISK_BANDS via for..of (NOT .find()) per risk.ts:39-44
 * precedent — same source of truth as RiskLabel; no hardcoded band strings.
 */

import { useId, useState } from 'react';
import type { AnalyzeResponse, RiskBand } from '@ghost/shared';
import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';
import { OverlayHeader } from './OverlayHeader.js';
import { ScoreDial } from './ScoreDial.js';
import { RiskLabel } from './RiskLabel.js';
import { ReasonsList } from './ReasonsList.js';
import { SignalBreakdownDrawer } from './SignalBreakdownDrawer.js';
import { VERDICT_LINES } from './labels.js';

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
      {/* Verdict accent strip — a thin gradient bar keys the card to the band. */}
      <div
        aria-hidden="true"
        className="shrink-0"
        style={{ height: 3, backgroundImage: `linear-gradient(90deg, ${lightAccent}, ${accent})` }}
      />

      <OverlayHeader onDismiss={onDismiss} />

      {/* Aria-live announcement for screen readers (UI-SPEC §Accessibility line 610). */}
      <span className="sr-only" aria-live="polite">
        Trust score: {response.score} out of 100. Verdict:{' '}
        {bandLabelFor(response.risk)}.
      </span>

      {/* Score block — eyebrow + dial + verdict. Pinned (shrink-0) so the hero
          stays visible while reasons scroll. No background tint: the gauge arc
          + its own glow carry the verdict colour (avoids a muddy reflection on
          the dark glass). */}
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

      {/* Reasons block — the only scroll region (min-h-0 lets it shrink inside
          the capped flex column; gjd-ov-scroll themes the scrollbar). */}
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

/**
 * Resolve a RiskBand key to its human-readable label via the same single
 * source of truth as RiskLabel — RISK_BANDS const tuple, iterated for..of
 * (NOT .find()) per risk.ts:39-44 Pattern D precedent. One-line dup with
 * RiskLabel.tsx accepted for Phase 4; a shared helper isn't worth the extra
 * indirection at this scale.
 */
function bandLabelFor(risk: RiskBand): string {
  for (const band of RISK_BANDS) {
    if (band.key === risk) return band.label;
  }
  return 'Unknown';
}
