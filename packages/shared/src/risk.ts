export const RISK_BANDS = [
  { key: 'legitimate', min: 80, max: 100, label: 'Legitimate' },
  { key: 'caution', min: 50, max: 79, label: 'Caution' },
  { key: 'suspicious', min: 20, max: 49, label: 'Suspicious' },
  { key: 'ghost', min: 0, max: 19, label: 'Likely Ghost Job' },
] as const;

export type RiskBandEntry = (typeof RISK_BANDS)[number];

export type RiskBand = RiskBandEntry['key'];

export function bandFor(score: number): RiskBand {
  for (const band of RISK_BANDS) {
    if (score >= band.min && score <= band.max) return band.key;
  }
  return 'ghost';
}
