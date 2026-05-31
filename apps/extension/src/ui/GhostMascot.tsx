import type { RiskBand } from '@ghost/shared';
import { VERDICTS } from './verdict';

export type MascotMode = 'idle' | 'loading' | 'verdict' | 'peek' | 'puzzled';

interface GhostMascotProps {
  mode?: MascotMode;
  band?: RiskBand;
  size?: number;
  still?: boolean;
}

export function GhostMascot({ mode = 'idle', band, size = 72, still = false }: GhostMascotProps) {
  const accent = mode === 'verdict' && band ? VERDICTS[band].solid : 'var(--ink-soft)';
  const opacity = mode === 'loading' ? 0.45 : 1;
  const positive = band === 'legitimate' || band === 'caution';

  let mouth = 'M26 44 Q32 47 38 44';
  if (mode === 'verdict') mouth = positive ? 'M25 43 Q32 49 39 43' : 'M28 45 h8';
  if (mode === 'puzzled') mouth = 'M27 45 q2.5 -3 5 0 t5 0';

  return (
    <svg
      width={size}
      height={size * (72 / 64)}
      viewBox="0 0 64 72"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={still ? undefined : 'gjd-bob'}
      style={{
        opacity,
        transform: mode === 'puzzled' ? 'rotate(-6deg)' : undefined,
        transition: 'opacity var(--dur-standard) var(--ease-expo)',
        willChange: 'transform',
      }}
    >
      <path
        d="M10 38a22 22 0 0 1 44 0v22l-7-5-7 5-7-5-7 5-7-5z"
        stroke={accent}
        strokeWidth={2.4}
        strokeLinejoin="round"
        style={{ transition: 'stroke var(--dur-recolor) var(--ease-expo)' }}
      />
      <path d="M10 38a22 22 0 0 1 44 0v22l-7-5-7 5-7-5-7 5-7-5z" fill={accent} opacity={0.07} />
      <circle cx="25" cy="35" r="2.4" fill={accent} />
      <circle cx="39" cy="35" r="2.4" fill={accent} />
      <path d={mouth} stroke={accent} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      {mode === 'puzzled' && (
        <text x="50" y="20" fontSize="16" fontWeight={700} fill={accent}>
          ?
        </text>
      )}
    </svg>
  );
}
