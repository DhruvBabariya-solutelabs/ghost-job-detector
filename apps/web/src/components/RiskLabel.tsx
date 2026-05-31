import type { RiskBand } from '@ghost/shared';
import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';

export interface RiskLabelProps {
  band: RiskBand;
}

export function RiskLabel({ band }: RiskLabelProps) {
  let label = 'Unknown';
  for (const b of RISK_BANDS) {
    if (b.key === band) {
      label = b.label;
      break;
    }
  }

  return (
    <div className="flex justify-center mt-3">
      <span
        className="px-3.5 py-1 rounded-full text-lg font-semibold tracking-tight"
        style={{
          backgroundColor: `color-mix(in oklch, ${RISK_COLORS[band]} 22%, transparent)`,
          color: `var(--color-risk-${band}-fg)`,
          boxShadow: `inset 0 0 0 1px ${RISK_COLORS[band]}55`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
