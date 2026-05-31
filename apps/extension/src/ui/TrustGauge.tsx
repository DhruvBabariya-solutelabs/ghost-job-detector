import { useEffect, useId, useRef } from 'react';
import type { RiskBand } from '@ghost/shared';
import { VERDICTS } from './verdict';
import { DUR, EASE, SPRING_DEFAULT, springDurationMs, springKeyframes } from './motion';

const VIEW = 220;
const CENTER = VIEW / 2;
const RADIUS = 88;
const STROKE = 14;
const SWEEP = 270; // degrees of arc
const START = 225; // compass deg (clockwise from top); bottom-left

/** Compass angle (deg, clockwise from top) → cartesian point on the gauge. */
function pt(angleDeg: number, r = RADIUS): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CENTER + r * Math.sin(a), y: CENTER - r * Math.cos(a) };
}

/** SVG arc path across `sweep` degrees starting at `start`, clockwise. */
function arcPath(start: number, sweep: number, r = RADIUS): string {
  const a = pt(start, r);
  const b = pt(start + sweep, r);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y}`;
}

export interface TrustGaugeProps {
  score: number;
  band: RiskBand;
  /** Animate the draw-on + count-up; false snaps to final (revisiting a result). */
  animate: boolean;
  reducedMotion: boolean;
  size?: number;
}

export function TrustGauge({ score, band, animate, reducedMotion, size = 200 }: TrustGaugeProps) {
  const v = VERDICTS[band];
  const uid = useId().replace(/:/g, '');
  const arcRef = useRef<SVGPathElement | null>(null);
  const needleRef = useRef<SVGGElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);

  const clamped = Math.max(0, Math.min(100, score));
  const frac = clamped / 100;
  const needleAngle = START + frac * SWEEP;
  const finalOffset = 1 - frac; // pathLength normalised to 1

  // biome-ignore lint/correctness/useExhaustiveDependencies: the reveal must re-run only when the score/band/animate flag changes — the omitted values (frac, finalOffset, clamped, needleAngle) are all derived from score and recomputed inside the effect.
  useEffect(() => {
    const arc = arcRef.current;
    const needle = needleRef.current;
    const num = numRef.current;
    if (!arc || !needle || !num) return;

    const doAnimate = animate && !reducedMotion;

    if (!doAnimate) {
      arc.style.strokeDashoffset = String(finalOffset);
      needle.style.transform = `rotate(${needleAngle}deg)`;
      num.textContent = String(clamped);
      return;
    }

    // Arc draw-on.
    const arcAnim = arc.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: finalOffset }], {
      duration: DUR.hero,
      easing: EASE.expo,
      fill: 'forwards',
    });

    // Needle spring overshoot from the start (0) angle to the score angle.
    const springDur = springDurationMs(SPRING_DEFAULT);
    const needleAnim = needle.animate(
      springKeyframes((p) => ({
        transform: `rotate(${START + p * frac * SWEEP}deg)`,
      })),
      { duration: springDur, easing: 'linear', fill: 'forwards' },
    );

    // Count-up driven off the arc animation's own clock so it tracks the draw.
    let raf = 0;
    const tick = (): void => {
      const ct = typeof arcAnim.currentTime === 'number' ? arcAnim.currentTime : DUR.hero;
      const p = Math.min(1, ct / DUR.hero);
      num.textContent = String(Math.round(clamped * p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else num.textContent = String(clamped);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      arcAnim.cancel();
      needleAnim.cancel();
      cancelAnimationFrame(raf);
    };
  }, [score, band, animate, reducedMotion]);

  const trackPath = arcPath(START, SWEEP);
  const needleTip = pt(START, RADIUS - STROKE - 6); // before rotation (angle START)

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        margin: '0 auto',
      }}
      role="img"
      aria-label={`Trust score ${clamped} of 100 — ${v.word}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={v.from} />
            <stop offset="100%" stopColor={v.to} />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Glow (blurred copy of the value arc, opacity-pulsing) */}
        <path
          d={trackPath}
          fill="none"
          stroke={`url(#grad-${uid})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={finalOffset}
          filter={`url(#glow-${uid})`}
          className={reducedMotion ? undefined : 'gjd-glow'}
          style={{ opacity: 0.5 }}
        />

        {/* Value arc */}
        <path
          ref={arcRef}
          d={trackPath}
          fill="none"
          stroke={`url(#grad-${uid})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={animate && !reducedMotion ? 1 : finalOffset}
          style={{ willChange: 'stroke-dashoffset' }}
        />

        {/* Needle — rotates about centre */}
        <g
          ref={needleRef}
          style={{
            transformOrigin: `${CENTER}px ${CENTER}px`,
            transform: `rotate(${animate && !reducedMotion ? START : needleAngle}deg)`,
            willChange: 'transform',
          }}
        >
          <line
            x1={CENTER}
            y1={CENTER}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={v.solid}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: 'stroke var(--dur-recolor) var(--ease-expo)' }}
          />
        </g>
        <circle cx={CENTER} cy={CENTER} r={6} fill={v.solid} />
        <circle cx={CENTER} cy={CENTER} r={6} fill="var(--bg)" opacity={0.25} />
      </svg>

      {/* Centre numeral (HTML for crisp tabular-nums type) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: size * 0.06,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span
            ref={numRef}
            className="gjd-tnum"
            style={{
              fontSize: size * 0.3,
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            {animate && !reducedMotion ? 0 : clamped}
          </span>
          <span
            className="gjd-tnum"
            style={{
              fontSize: size * 0.11,
              fontWeight: 600,
              color: 'var(--ink-faint)',
            }}
          >
            /100
          </span>
        </div>
        <span
          style={{
            marginTop: 2,
            fontSize: size * 0.058,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          Trust Score
        </span>
      </div>
    </div>
  );
}
