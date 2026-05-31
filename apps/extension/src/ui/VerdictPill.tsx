import type { RiskBand } from '@ghost/shared';
import { VERDICTS } from './verdict';
import { VerdictIcon } from './icons';

interface VerdictPillProps {
  band: RiskBand;
  animate: boolean;
  reducedMotion: boolean;
}

export function VerdictPill({ band, animate, reducedMotion }: VerdictPillProps) {
  const v = VERDICTS[band];
  return (
    <span
      className="gjd-tnum"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 13px 5px 10px',
        borderRadius: 'var(--r-pill)',
        fontSize: 'var(--t-sm)',
        fontWeight: 700,
        letterSpacing: '0.01em',
        color: 'light-dark(var(--v-deep), var(--v-solid))',
        background: 'color-mix(in oklab, var(--v-solid) 16%, transparent)',
        border: '1px solid color-mix(in oklab, var(--v-solid) 38%, transparent)',
        animation:
          animate && !reducedMotion
            ? 'gjd-pop var(--dur-recolor) var(--ease-expo) both'
            : undefined,
        // pill appears just after the gauge starts settling
        animationDelay: animate && !reducedMotion ? '520ms' : undefined,
        willChange: 'transform',
      }}
    >
      <VerdictIcon iconKey={v.iconKey} size={15} style={{ color: 'var(--v-solid)' }} />
      {v.word}
    </span>
  );
}
