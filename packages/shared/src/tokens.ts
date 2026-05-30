/**
 * JS mirror of design tokens from packages/shared/src/theme.css (D-20).
 *
 * MANUAL SYNC: This file mirrors values in ./theme.css. When you retune a hex
 * value for AA contrast in Phase 4/5 polish, update BOTH files in the same
 * commit AND update the literal-type checkpoint (`_ASSERT_*`) below.
 *
 * Build-time CSS-parser codegen is REJECTED (D-21 + Phase 1 D-10/D-11 +
 * CLAUDE.md "shared packages export raw .ts and skip a build step"). The
 * drift-detection assertions below are a typecheck-time trap, not a build
 * step — `tsc --noEmit` fires if a hex value drifts away from its checkpoint
 * without the checkpoint being updated.
 *
 * Consumers:
 * - Phase 4 / 5 <ScoreDial> reads RISK_COLORS for SVG <linearGradient> stops
 *   (closed Shadow DOM cannot use getComputedStyle reliably across the boundary).
 * - EASE_OUT_SOFT powers the 700 ms reveal animation.
 * - FONT_SANS is the system font stack (D-07) for inline-style overrides.
 */

import type { RiskBand } from './risk.js';

/**
 * Per-band fill color (hex). Keys MUST stay aligned with RiskBand and with
 * `--color-risk-*` in theme.css. Drift between this object and theme.css is
 * caught at compile time by the `_ASSERT_*` checkpoints below.
 */
export const RISK_COLORS = {
  legitimate: '#16a34a',
  caution: '#ca8a04',
  suspicious: '#ea580c',
  ghost: '#dc2626',
} as const;

/** Primary CTA / brand color (mirrors --color-brand). */
export const BRAND = '#2563eb' as const;

/** Score-dial reveal easing (mirrors --ease-out-soft, Phase 1 D-08). */
export const EASE_OUT_SOFT = 'cubic-bezier(0.22, 1, 0.36, 1)' as const;

/**
 * System font stack (mirrors --font-sans, Phase 1 D-07). System-only on purpose:
 * Shadow-DOM-loaded custom fonts FOUC and the extension should blend visually
 * with the host page (LinkedIn / Indeed).
 */
export const FONT_SANS =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' as const;

// === Drift-detection assertions ===
// These produce a typecheck error if a hex value above is changed without
// also updating the literal-type checkpoint here. Keep these in sync
// intentionally — to retune a value, change BOTH the constant AND this
// literal type in the same commit.
//
// Note (Open Question 3): Biome 2 `recommended` does NOT flag these `_ASSERT_*`
// consts as unused — likely because they carry literal-type annotations that
// Biome treats as type-shape declarations. No `biome-ignore` pragma is needed
// today. Re-add `// biome-ignore lint/correctness/noUnusedVariables: drift-detection assertions`
// above each line if a future Biome version starts emitting the unused warning.

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

// === Key-coverage assertion ===
// Ensures RISK_COLORS keys exactly match the RiskBand union from risk.ts.
// If a future commit adds a new RiskBand variant without adding a color
// (or vice versa), `_RiskColorsCoverRiskBand` resolves to `never` and the
// `_ASSERT_KEYS` line fails to compile.

type _RiskColorsCoverRiskBand = RiskBand extends keyof typeof RISK_COLORS
  ? keyof typeof RISK_COLORS extends RiskBand
    ? true
    : never
  : never;

const _ASSERT_KEYS: _RiskColorsCoverRiskBand = true;
void _ASSERT_KEYS;
