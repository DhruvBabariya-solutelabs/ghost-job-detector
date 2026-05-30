/**
 * ScoreDial (web) — animated SVG dial with WAAPI 700ms reveal.
 *
 * D-70 duplicated v1 from apps/extension/src/content/overlay/ScoreDial.tsx.
 * The extension dial is locked at 128×128; the web app needs BOTH that variant
 * (for /analyze + the /dashboard read-only modal — visually mirrors the extension)
 * AND a 160×160 variant for the landing hero + interactive Demo section. The
 * `size` prop parameterizes the geometry without forking the component (UI-SPEC
 * line 484 + Phase 5 §"Cross-Surface Consistency Summary").
 *
 * Animation contract (UI-SPEC §Motion + D-49 — UNCHANGED from extension):
 *   - 700ms WAAPI animation on strokeDashoffset, EASE_OUT_SOFT easing
 *   - Counter increments driven off anim.currentTime (NOT raw performance.now())
 *   - prefers-reduced-motion: synchronous snap to final state, no animation
 *   - Color locked to RISK_COLORS[risk] from frame 0 (does NOT animate)
 *   - tabular-nums on counter prevents digit-width wobble
 *
 * Geometry derived from `size` at runtime:
 *   - radius = (size - stroke) / 2  → 58 when size=128, 74 when size=160
 *   - circ   = 2 * Math.PI * radius → 364.42 when size=128, 464.96 when size=160
 *   - counterFontSize = 48 when size=160, 36 when size=128 (UI-SPEC line 93)
 *
 * The dial IS the drawer toggle (UI-SPEC line 293) — clicking opens the
 * SignalBreakdownDrawer. Wrapped in a <button> for keyboard accessibility.
 */

import { useEffect, useRef } from 'react';
import type { RiskBand } from '@ghost/shared';
import { RISK_COLORS, EASE_OUT_SOFT } from '@ghost/shared';

export interface ScoreDialProps {
  score: number;
  risk: RiskBand;
  size?: 128 | 160;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  drawerId: string;
}

export function ScoreDial({
  score,
  risk,
  size = 128,
  drawerOpen,
  onToggleDrawer,
  drawerId,
}: ScoreDialProps) {
  const indicatorRef = useRef<SVGCircleElement | null>(null);
  const counterRef = useRef<SVGTSpanElement | null>(null);

  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const counterFontSize = size === 160 ? 48 : 36;

  useEffect(() => {
    const circle = indicatorRef.current;
    const counter = counterRef.current;
    if (circle === null || counter === null) return;

    // Re-derive circ from `size` inside the effect so Biome's exhaustive-deps
    // analyzer sees `size` as a real dependency (NOT a transitive one) — matches
    // the plan's "deps array MUST include both [score, size]" contract.
    const localStroke = 12;
    const localRadius = (size - localStroke) / 2;
    const localCirc = 2 * Math.PI * localRadius;
    const finalOffset = localCirc * (1 - score / 100);

    // prefers-reduced-motion: snap to final state synchronously, no animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      circle.style.strokeDashoffset = String(finalOffset);
      counter.textContent = String(score);
      return;
    }

    const anim = circle.animate(
      [{ strokeDashoffset: localCirc }, { strokeDashoffset: finalOffset }],
      { duration: 700, easing: EASE_OUT_SOFT, fill: 'forwards' }
    );

    const t0 = performance.now();
    let rafId = 0;
    const step = (t: number): void => {
      const elapsed = t - t0;
      const p = Math.min(1, elapsed / 700);
      const eased =
        anim.currentTime !== null
          ? Number(anim.currentTime) / 700
          : 1 - Math.pow(1 - p, 3);
      counter.textContent = String(Math.round(score * eased));
      if (p < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        counter.textContent = String(score);
      }
    };
    rafId = requestAnimationFrame(step);

    return () => {
      anim.cancel();
      cancelAnimationFrame(rafId);
    };
  }, [score, size]);

  return (
    <button
      type="button"
      onClick={onToggleDrawer}
      aria-expanded={drawerOpen}
      aria-controls={drawerId}
      aria-label={drawerOpen ? 'Hide signal breakdown' : 'Show signal breakdown'}
      className="block mx-auto rounded-full focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          ref={indicatorRef}
          data-indicator
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={RISK_COLORS[risk]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ willChange: 'transform' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={counterFontSize}
          fontWeight={600}
          fill="currentColor"
        >
          <tspan ref={counterRef}>0</tspan>
        </text>
      </svg>
    </button>
  );
}
