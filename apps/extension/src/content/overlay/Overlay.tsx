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

export interface OverlayProps {
  response: AnalyzeResponse;
  onDismiss: () => void;
}

export function Overlay({ response, onDismiss }: OverlayProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();

  const accent = RISK_COLORS[response.risk];
  // Soft band-tinted radial behind the score block — fades from 7% alpha at
  // the dial center to fully transparent at ~70% radius. Hero Score motif.
  const scoreBackdrop = {
    backgroundImage: `radial-gradient(circle at 50% 38%, color-mix(in oklch, ${accent} 7%, transparent), transparent 70%)`,
  };

  return (
    <div
      className="fixed top-4 right-4 w-80 bg-(--color-surface) text-(--color-ink) border border-(--color-border) rounded-lg shadow-(--shadow-overlay) overflow-hidden font-sans z-[2147483647]"
      style={{
        fontVariantNumeric: 'tabular-nums',
        // Explicit opaque fallback — defense in depth in case the CSS var fails
        // to resolve inside the shadow root (e.g. Tailwind regression). Host
        // page text must never bleed through the overlay.
        backgroundColor: 'var(--color-surface, #fcfcfd)',
      }}
    >
      <OverlayHeader onDismiss={onDismiss} />

      {/* Aria-live announcement for screen readers (UI-SPEC §Accessibility line 610). */}
      <span className="sr-only" aria-live="polite">
        Trust score: {response.score} out of 100. Verdict:{' '}
        {bandLabelFor(response.risk)}.
      </span>

      {/* Score block — eyebrow + dial + verdict, unified by radial backdrop. */}
      <div
        className="px-4 pt-4 pb-3 flex flex-col items-center"
        style={scoreBackdrop}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-ink-muted) mb-1">
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
      </div>

      {/* Reasons block */}
      <div className="px-4 pb-4">
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
