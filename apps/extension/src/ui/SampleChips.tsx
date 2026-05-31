import type { RiskBand } from '@ghost/shared';
import { RISK_BANDS } from '@ghost/shared';
import { VerdictIcon } from './icons';
import { VERDICTS } from './verdict';

interface SampleChipsProps {
  onPick: (band: RiskBand) => void;
  disabled?: boolean;
  columns?: number;
}

export function SampleChips({ onPick, disabled = false, columns = 2 }: SampleChipsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 8,
      }}
    >
      {RISK_BANDS.map((b) => {
        const v = VERDICTS[b.key];
        return (
          <button
            key={b.key}
            type="button"
            disabled={disabled}
            onClick={() => onPick(b.key)}
            title={`Load a ${v.word} sample`}
            className="gjd-focus gjd-chip"
            style={{
              all: 'unset',
              boxSizing: 'border-box',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 11px',
              borderRadius: 'var(--r-card)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              background: `color-mix(in oklab, ${v.solid} 12%, var(--surface))`,
              border: `1px solid color-mix(in oklab, ${v.solid} 30%, transparent)`,
              color: `light-dark(${v.deep}, ${v.from})`,
              fontSize: 'var(--t-sm)',
              fontWeight: 600,
            }}
          >
            <VerdictIcon iconKey={v.iconKey} size={15} style={{ color: v.solid, flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {v.word}
            </span>
          </button>
        );
      })}
    </div>
  );
}
