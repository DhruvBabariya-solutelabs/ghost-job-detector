/**
 * Display labels and deep-text color variants for the overlay UI.
 *
 * SIGNAL_LABELS maps SignalKey → human-readable text (UI-SPEC drawer copy mapping).
 * BAND_DEEP_TEXT maps RiskBand → the AA-contrast deep-color text variant used
 * on tinted-12%-alpha backgrounds (UI-SPEC §Color lines 139-143).
 *
 * Home is THIS file (not @ghost/shared) per CLAUDE.md "duplicated v1" convention —
 * Phase 5's WEB-04 will ship its own copy in apps/web/src/components/.
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

/**
 * One-line, plain-language verdict shown under the RiskLabel chip. Calm,
 * confident, never alarmist (Copywriting Contract). Local to the overlay per
 * the "duplicated v1" convention — the popup keeps its own copy in verdict.ts.
 */
export const VERDICT_LINES: Record<RiskBand, string> = {
  legitimate: 'Likely a real, active role — apply with confidence.',
  caution: 'Probably real, but some details are vague — read closely.',
  suspicious: 'Several red flags here — verify the company before applying.',
  ghost: 'Strong signs of a ghost or scam listing — be careful.',
};
