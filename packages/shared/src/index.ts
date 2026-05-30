/**
 * Public API for @ghost/shared.
 *
 * See per-module files for documentation; the barrel re-exports everything
 * so consumers import via `from '@ghost/shared'` (NOT from subpaths — Vite +
 * Next.js subpath resolution is fragile in monorepos).
 *
 * `export *` (not named re-exports) — adding a new symbol to any module
 * propagates automatically. With four small files and no name collisions,
 * this is the simplest contract.
 *
 * Modules:
 * - contracts: JobPostingSchema + types + ANALYZE_HEADER_KEY/PATH
 * - risk:      RISK_BANDS + RiskBand + bandFor
 * - buzzwords: BUZZWORDS + BuzzwordCategory
 * - tokens:    RISK_COLORS + BRAND + EASE_OUT_SOFT + FONT_SANS (+ drift asserts)
 *
 * Phase-1 note: the `SHARED_PACKAGE_NAME` sentinel exported by Phase 1 has
 * been retired — the real contract imports below now prove cross-package
 * resolution from @ghost/scoring, apps/web, and apps/extension.
 */

// NOTE: NO `.js` extensions on these `export *` lines. Next.js webpack (via
// transpilePackages) cannot resolve `./contracts.js` to `./contracts.ts` for
// re-exports — it treats `export *` differently from `import type` and fails
// with "Module not found: Can't resolve './contracts.js'". The extension-less
// form is the most-portable across tsc --noEmit + Next.js webpack + WXT/Vite
// (per RESEARCH.md Pattern 4 fallback note + Pitfall 5 mitigation).
//
// Cross-module imports INSIDE packages/shared/src/ (e.g., contracts.ts and
// tokens.ts importing RiskBand from risk) DO use the `.js` extension because
// they go through tsc's resolver, not webpack's barrel re-export path.
export * from './contracts';
export * from './risk';
export * from './buzzwords';
export * from './tokens';
export * from './fixtures/postings';
