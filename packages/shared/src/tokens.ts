import type { RiskBand } from './risk.js';

export const RISK_COLORS = {
  legitimate: '#16a34a',
  caution: '#ca8a04',
  suspicious: '#ea580c',
  ghost: '#dc2626',
} as const;

export const BRAND = '#2563eb' as const;

export const EASE_OUT_SOFT = 'cubic-bezier(0.22, 1, 0.36, 1)' as const;

export const FONT_SANS =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' as const;

const _ASSERT_LEGITIMATE: '#16a34a' = RISK_COLORS.legitimate;
const _ASSERT_CAUTION: '#ca8a04' = RISK_COLORS.caution;
const _ASSERT_SUSPICIOUS: '#ea580c' = RISK_COLORS.suspicious;
const _ASSERT_GHOST: '#dc2626' = RISK_COLORS.ghost;
const _ASSERT_BRAND: '#2563eb' = BRAND;
void _ASSERT_LEGITIMATE;
void _ASSERT_CAUTION;
void _ASSERT_SUSPICIOUS;
void _ASSERT_GHOST;
void _ASSERT_BRAND;

type _RiskColorsCoverRiskBand = RiskBand extends keyof typeof RISK_COLORS
  ? keyof typeof RISK_COLORS extends RiskBand
    ? true
    : never
  : never;

const _ASSERT_KEYS: _RiskColorsCoverRiskBand = true;
void _ASSERT_KEYS;
