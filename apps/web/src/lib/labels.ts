/**
 * Display labels and deep-text color variants for the web app UI.
 *
 * SIGNAL_LABELS maps SignalKey → human-readable text (UI-SPEC drawer copy mapping
 * + How-it-works section card headings — Phase 5 §Copywriting).
 * BAND_DEEP_TEXT maps RiskBand → the AA-contrast deep-color text variant used
 * on tinted-12%-alpha backgrounds (Phase 5 UI-SPEC §"Color" lines 139-143).
 *
 * D-70 duplicated v1 — verbatim from apps/extension/src/content/overlay/labels.ts.
 * The extension's labels.ts is the canonical home; this file is the second-and-final
 * v1 consumer (web app). V2-06 may extract both into packages/ui after v1 ships.
 * Hex values MUST match the extension verbatim — do NOT retune.
 *
 * Record<closed-enum, string> annotations force exhaustiveness — adding a new
 * SignalKey or RiskBand in @ghost/shared without updating these maps fails typecheck.
 */

import type { SignalKey, RiskBand } from '@ghost/shared';

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  ai: 'AI-generated text',
  specificity: 'Specificity',
  buzzword: 'Buzzword density',
  scam: 'Scam signals',
  llm: 'LLM authenticity',
};

export const BAND_DEEP_TEXT: Record<RiskBand, string> = {
  legitimate: '#15803d',
  caution: '#a16207',
  suspicious: '#c2410c',
  ghost: '#b91c1c',
};
