import type { RiskBand } from '@ghost/shared';
import { EASE_OUT_SOFT, RISK_COLORS } from '@ghost/shared';
import { useEffect, useRef } from 'react';

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

    const localStroke = 12;
    const localRadius = (size - localStroke) / 2;
    const localCirc = 2 * Math.PI * localRadius;
    const finalOffset = localCirc * (1 - score / 100);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      circle.style.strokeDashoffset = String(finalOffset);
      counter.textContent = String(score);
      return;
    }

    const anim = circle.animate(
      [{ strokeDashoffset: localCirc }, { strokeDashoffset: finalOffset }],
      { duration: 700, easing: EASE_OUT_SOFT, fill: 'forwards' },
    );

    const t0 = performance.now();
    let rafId = 0;
    const step = (t: number): void => {
      const elapsed = t - t0;
      const p = Math.min(1, elapsed / 700);
      const eased = anim.currentTime !== null ? Number(anim.currentTime) / 700 : 1 - (1 - p) ** 3;
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
