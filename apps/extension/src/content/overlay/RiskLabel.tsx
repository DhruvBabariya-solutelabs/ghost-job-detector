import type { RiskBand } from '@ghost/shared';
import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';
import type { ReactElement } from 'react';

export interface RiskLabelProps {
  band: RiskBand;
}

interface IconProps {
  className?: string;
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 5" />
    </svg>
  );
}

function WarnIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2.5 14 13H2L8 2.5z" />
      <path d="M8 6.5v3" />
      <path d="M8 11.25v.25" />
    </svg>
  );
}

function AlertIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx={8} cy={8} r={6} />
      <path d="M8 4.75v3.5" />
      <path d="M8 10.75v.25" />
    </svg>
  );
}

function XCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx={8} cy={8} r={6} />
      <path d="M5.5 5.5 10.5 10.5" />
      <path d="M10.5 5.5 5.5 10.5" />
    </svg>
  );
}

const BAND_ICONS: Record<RiskBand, (props: IconProps) => ReactElement> = {
  legitimate: CheckIcon,
  caution: WarnIcon,
  suspicious: AlertIcon,
  ghost: XCircleIcon,
};

export function RiskLabel({ band }: RiskLabelProps) {
  let label = 'Unknown';
  for (const b of RISK_BANDS) {
    if (b.key === band) {
      label = b.label;
      break;
    }
  }

  const Icon = BAND_ICONS[band];
  const accent = RISK_COLORS[band];
  const brightText = `color-mix(in oklch, ${accent} 72%, white)`;

  return (
    <div className="flex justify-center mt-3">
      <span
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full text-[15px] font-semibold border"
        style={{
          backgroundColor: `color-mix(in oklch, ${accent} 20%, transparent)`,
          borderColor: `color-mix(in oklch, ${accent} 42%, transparent)`,
          color: brightText,
        }}
      >
        <Icon className="w-4 h-4" />
        {label}
      </span>
    </div>
  );
}
