/**
 * Minimal geometric line-art ghost mascot — the brand touch.
 *
 * Not cartoonish: a single rounded body with a 3-lobe wavy hem, two dot eyes,
 * and a one-stroke mouth that shifts with sentiment. It idles with a slow bob,
 * phases translucent while loading, and tints to the verdict colour on a result.
 *
 * Pure transform/opacity motion (the bob is a CSS keyframe). Decorative —
 * aria-hidden; the meaning is always carried by adjacent text.
 */

import type { RiskBand } from '@ghost/shared';
import { VERDICTS } from './verdict';

export type MascotMode = 'idle' | 'loading' | 'verdict' | 'peek' | 'puzzled';

interface GhostMascotProps {
  mode?: MascotMode;
  band?: RiskBand;
  size?: number;
  /** Disable the idle bob (reduced-motion). */
  still?: boolean;
}

export function GhostMascot({ mode = 'idle', band, size = 72, still = false }: GhostMascotProps) {
  const accent = mode === 'verdict' && band ? VERDICTS[band].solid : 'var(--ink-soft)';
  const opacity = mode === 'loading' ? 0.45 : 1;
  const positive = band === 'legitimate' || band === 'caution';

  // Mouth: gentle smile for trusting verdicts, small neutral "o" otherwise,
  // a flat line at idle. Puzzled gets a tiny wobble line.
  let mouth = 'M26 44 Q32 47 38 44'; // idle: faint smile
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
      {/* Body: dome + 3-lobe wavy hem */}
      <path
        d="M10 38a22 22 0 0 1 44 0v22l-7-5-7 5-7-5-7 5-7-5z"
        stroke={accent}
        strokeWidth={2.4}
        strokeLinejoin="round"
        style={{ transition: 'stroke var(--dur-recolor) var(--ease-expo)' }}
      />
      {/* Soft inner fill so glass cards read it as a shape, not an outline */}
      <path d="M10 38a22 22 0 0 1 44 0v22l-7-5-7 5-7-5-7 5-7-5z" fill={accent} opacity={0.07} />
      {/* Eyes */}
      <circle cx="25" cy="35" r="2.4" fill={accent} />
      <circle cx="39" cy="35" r="2.4" fill={accent} />
      {/* Mouth */}
      <path d={mouth} stroke={accent} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      {mode === 'puzzled' && (
        <text x="50" y="20" fontSize="16" fontWeight={700} fill={accent}>
          ?
        </text>
      )}
    </svg>
  );
}
