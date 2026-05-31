import { GhostMascot } from '../GhostMascot';
import { useReducedMotion } from '../useReducedMotion';

function SkeletonLine({ w, delay = 0 }: { w: string; delay?: number }) {
  return (
    <div
      style={{
        position: 'relative',
        height: 10,
        width: w,
        borderRadius: 'var(--r-pill)',
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}
    >
      <div
        className="gjd-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent, color-mix(in oklab, var(--ink) 12%, transparent), transparent)',
          animationDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

export function LoadingState({ size = 200 }: { size?: number }) {
  const reduced = useReducedMotion();
  const R = 92;
  const C = 110;

  return (
    <div
      className="gjd-fade"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
    >
      <div style={{ position: 'relative', width: size, height: size }} aria-hidden="true">
        <svg
          width={size}
          height={size}
          viewBox="0 0 220 220"
          style={{ display: 'block' }}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="gjd-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border-strong)" strokeWidth={2} />
          <circle cx={C} cy={C} r={R * 0.66} fill="none" stroke="var(--border)" strokeWidth={1.5} />
          <circle cx={C} cy={C} r={R * 0.33} fill="none" stroke="var(--border)" strokeWidth={1.5} />
          <g
            className={reduced ? undefined : 'gjd-radar'}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <path
              d={`M ${C} ${C} L ${C} ${C - R} A ${R} ${R} 0 0 1 ${C + R * 0.7} ${C - R * 0.7} Z`}
              fill="url(#gjd-sweep)"
              opacity={0.5}
            />
            <line
              x1={C}
              y1={C}
              x2={C}
              y2={C - R}
              stroke="var(--brand)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <GhostMascot mode="loading" size={54} still={reduced} />
        </div>
      </div>

      <span
        className="gjd-tnum"
        role="status"
        aria-live="polite"
        style={{
          fontSize: 'var(--t-sm)',
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: 'var(--ink-muted)',
        }}
      >
        Scanning this posting…
      </span>

      <div
        className="gjd-card"
        style={{ width: '100%', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <SkeletonLine w="80%" />
        <SkeletonLine w="55%" delay={120} />
        <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
        <SkeletonLine w="92%" delay={200} />
        <SkeletonLine w="70%" delay={320} />
      </div>
    </div>
  );
}
