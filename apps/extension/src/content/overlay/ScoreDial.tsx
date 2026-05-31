/**
 * ScoreDial — animated 128x128 SVG dial with WAAPI 700ms reveal.
 *
 * The dial IS the drawer toggle (UI-SPEC line 293) — clicking the dial opens
 * the SignalBreakdownDrawer. Wrapped in a <button> for keyboard accessibility.
 *
 * Animation contract (UI-SPEC §Motion + D-49):
 *   - 700ms WAAPI animation on strokeDashoffset, EASE_OUT_SOFT easing
 *   - Counter increments driven off anim.currentTime (NOT raw performance.now())
 *   - prefers-reduced-motion: synchronous snap to final state, no animation
 *   - Color locked to RISK_COLORS[risk] from frame 0 (does NOT animate)
 *   - tabular-nums on counter prevents digit-width wobble
 */

import { useEffect, useId, useRef } from "react";
import type { RiskBand } from "@ghost/shared";
import { RISK_COLORS, EASE_OUT_SOFT } from "@ghost/shared";

const SIZE = 128;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2; // 58
const CIRC = 2 * Math.PI * RADIUS; // 364.4247719318987

export interface ScoreDialProps {
  score: number;
  risk: RiskBand;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  drawerId: string;
}

export function ScoreDial({
  score,
  risk,
  drawerOpen,
  onToggleDrawer,
  drawerId,
}: ScoreDialProps) {
  const indicatorRef = useRef<SVGCircleElement | null>(null);
  const counterRef = useRef<SVGTSpanElement | null>(null);
  const uid = useId().replace(/:/g, "");
  const accent = RISK_COLORS[risk];
  // Gradient stops derived from the band accent — brightened top stop reads
  // vividly on the dark glass.
  const lightStop = `color-mix(in oklch, ${accent} 62%, white)`;

  useEffect(() => {
    const circle = indicatorRef.current;
    const counter = counterRef.current;
    if (circle === null || counter === null) return;

    const finalOffset = CIRC * (1 - score / 100);

    // prefers-reduced-motion: snap to final state synchronously, no animation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      circle.style.strokeDashoffset = String(finalOffset);
      counter.textContent = String(score);
      return;
    }

    const anim = circle.animate(
      [{ strokeDashoffset: CIRC }, { strokeDashoffset: finalOffset }],
      { duration: 700, easing: EASE_OUT_SOFT, fill: "forwards" },
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
  }, [score]);

  return (
    <button
      type="button"
      onClick={onToggleDrawer}
      aria-expanded={drawerOpen}
      aria-controls={drawerId}
      aria-label={
        drawerOpen ? "Hide signal breakdown" : "Show signal breakdown"
      }
      className="block mx-auto rounded-full focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#7c5cff66]"
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox="0 0 128 128"
        aria-hidden="true"
        style={{ fontVariantNumeric: "tabular-nums", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`gjd-dial-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={lightStop} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--ov-border-strong)"
          strokeWidth={STROKE}
        />

        {/* Value arc — animated gradient stroke with a tight following glow. */}
        <circle
          ref={indicatorRef}
          data-indicator
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={`url(#gjd-dial-${uid})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            willChange: "transform",
            filter: `drop-shadow(0 0 3px color-mix(in oklch, ${accent} 45%, transparent))`,
          }}
        />

        {/* Numeral + /100 suffix */}
        <text
          x={SIZE / 2}
          y={60}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={40}
          fontWeight={700}
          letterSpacing="-0.02em"
          fill="var(--ov-ink)"
        >
          <tspan ref={counterRef}>0</tspan>
        </text>
        <text
          x={SIZE / 2}
          y={84}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          letterSpacing="0.04em"
          fill="var(--ov-ink-muted)"
        >
          / 100
        </text>
      </svg>
    </button>
  );
}
