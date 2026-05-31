/**
 * RiskLabel — the band-tinted verdict chip directly under the score-dial.
 *
 * Hero Score redesign: chip now carries a band-appropriate inline SVG icon
 * (check / warn-triangle / alert / x-circle) + a 1px tinted border + slightly
 * larger horizontal padding to read as a verdict, not a tag.
 *
 * Visual rule: 18px Semibold text in the band's DEEP color variant
 * (BAND_DEEP_TEXT — AA-contrast hand-picked per UI-SPEC §"Color" lines 139-143)
 * on a 14%-alpha tinted background of the band's RISK_COLOR.
 *
 * Iteration rule: iterate RISK_BANDS via for..of (NOT .find()) — mirrors
 * risk.ts:39-44's bandFor precedent. Under noUncheckedIndexedAccess, .find()
 * returns `T | undefined` regardless of the closed-tuple shape, which forces
 * unnecessary defensive code at every call-site.
 */

import type { ReactElement } from 'react';
import type { RiskBand } from '@ghost/shared';
import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';
import { BAND_DEEP_TEXT } from './labels.js';

export interface RiskLabelProps {
  band: RiskBand;
}

interface IconProps {
  className?: string;
}

/** Check glyph — for the "legitimate" band. */
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

/** Warning triangle — for the "caution" band. */
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

/** Alert-circle — for the "suspicious" band. */
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

/** X-circle — for the "ghost" band. */
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
  // Pattern D nuance per risk.ts:39-44 — for..of over the const tuple,
  // never .find() which returns T | undefined.
  let label = 'Unknown';
  for (const b of RISK_BANDS) {
    if (b.key === band) {
      label = b.label;
      break;
    }
  }

  const Icon = BAND_ICONS[band];
  const deep = BAND_DEEP_TEXT[band];
  const accent = RISK_COLORS[band];

  return (
    <div className="flex justify-center mt-3">
      <span
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full text-[15px] font-semibold border"
        style={{
          backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)`,
          borderColor: `color-mix(in oklch, ${accent} 26%, transparent)`,
          color: deep,
        }}
      >
        <Icon className="w-4 h-4" />
        {label}
      </span>
    </div>
  );
}
