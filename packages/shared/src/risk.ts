/**
 * Risk-band thresholds and metadata for trust scores (0..100).
 *
 * Keys MUST stay aligned with --color-risk-{legitimate,caution,suspicious,ghost}
 * in packages/shared/src/theme.css (Phase 1 D-06); tokens.ts pins the hex values;
 * theme.css ships the CSS custom properties; risk.ts owns the score → band mapping.
 *
 * Phase 2 D-19 locks RISK_BANDS as a frozen tuple plus a small linear-scan lookup
 * helper (bandFor). Threshold literals 80 / 50 / 20 live ONLY in this file
 * (SHRD-05 single-source-of-truth gate).
 *
 * IMPORTANT: bandFor MUST use `for..of` over the tuple. Do NOT use
 *   - Array.prototype.find — returns `T | undefined` regardless of
 *     noUncheckedIndexedAccess (Pitfall 2)
 *   - RISK_BANDS[0] direct indexing — `T | undefined` under noUncheckedIndexedAccess
 */

export const RISK_BANDS = [
  { key: 'legitimate', min: 80, max: 100, label: 'Legitimate' },
  { key: 'caution', min: 50, max: 79, label: 'Caution' },
  { key: 'suspicious', min: 20, max: 49, label: 'Suspicious' },
  { key: 'ghost', min: 0, max: 19, label: 'Likely Ghost Job' },
] as const;

export type RiskBandEntry = (typeof RISK_BANDS)[number];

export type RiskBand = RiskBandEntry['key'];

/**
 * Map a trust score (0..100, higher = more trustworthy) to its risk band key.
 *
 * Out-of-contract input (negative, NaN, > 100) falls through to 'ghost' as a
 * defensive runtime classification — the engine should never emit such a value,
 * but we don't crash if calibration during Phase 3 development produces a stray.
 *
 * @param score Trust score; expected range 0..100 (inclusive).
 * @returns The matching RiskBand key.
 */
export function bandFor(score: number): RiskBand {
  for (const band of RISK_BANDS) {
    if (score >= band.min && score <= band.max) return band.key;
  }
  return 'ghost';
}
