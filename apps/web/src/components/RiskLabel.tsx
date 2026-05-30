/**
 * RiskLabel (web) — the band-tinted pill that sits directly under the score-dial.
 *
 * D-70 duplicated v1 from apps/extension/src/content/overlay/RiskLabel.tsx.
 * Phase 5 UI-SPEC §"Risk label band" + 04-UI-SPEC lines 310-318.
 *
 * Visual rule: 20px Semibold text in the band's DEEP color variant
 * (BAND_DEEP_TEXT — AA-contrast hand-picked per UI-SPEC §"Color" lines 139-143)
 * on a 12%-alpha tinted background of the band's RISK_COLOR.
 *
 * Iteration rule: iterate RISK_BANDS via for..of (NOT .find()) — mirrors
 * risk.ts:39-44's bandFor precedent. Under noUncheckedIndexedAccess, .find()
 * returns `T | undefined` regardless of the closed-tuple shape, which forces
 * unnecessary defensive code at every call-site.
 *
 * Web app uses the `@/lib/labels` path alias instead of the extension's
 * relative `./labels.js` import — same constants, different home.
 */

import type { RiskBand } from '@ghost/shared';
import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';

export interface RiskLabelProps {
  band: RiskBand;
}

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
