import type { RiskBand, SignalKey } from '@ghost/shared';

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
