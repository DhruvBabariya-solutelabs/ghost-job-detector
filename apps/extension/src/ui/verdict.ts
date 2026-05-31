import type { CSSProperties } from 'react';
import type { RiskBand } from '@ghost/shared';

/** Constant brand violet — logo, focus ring, primary CTA. Never recolours. */
export const BRAND_VIOLET = '#7c5cff';

export type VerdictIconKey = 'shield' | 'alert' | 'flag' | 'ghost';

export interface VerdictTheme {
  band: RiskBand;
  /** Short word for the verdict pill. */
  word: string;
  /** One-line, plain-language, never-alarmist verdict sentence. */
  line: string;
  /** Gradient arc stops (also the share-card gradient). */
  from: string;
  to: string;
  /** Mid solid — needle, numerals, bright-on-dark chip text. */
  solid: string;
  /** AA-dark text variant for tinted chips in LIGHT mode. */
  deep: string;
  /** Glow colour (rgba) for the soft pulse. */
  glow: string;
  iconKey: VerdictIconKey;
}

export const VERDICTS: Record<RiskBand, VerdictTheme> = {
  legitimate: {
    band: 'legitimate',
    word: 'Trusted',
    line: 'Likely a real, active role — apply with confidence.',
    from: '#34e89e',
    to: '#0fb8ad',
    solid: '#1fce9f',
    deep: '#0b6e58',
    glow: 'rgba(52, 232, 158, 0.45)',
    iconKey: 'shield',
  },
  caution: {
    band: 'caution',
    word: 'Caution',
    line: 'Probably real, but some details are vague — read closely.',
    from: '#ffb75e',
    to: '#ed8f03',
    solid: '#f5a623',
    deep: '#8a5a00',
    glow: 'rgba(255, 183, 94, 0.4)',
    iconKey: 'alert',
  },
  suspicious: {
    band: 'suspicious',
    word: 'Suspicious',
    line: 'Several red flags here — verify the company before applying.',
    from: '#ff8567',
    to: '#ff5f6d',
    solid: '#ff6f68',
    deep: '#b23a2e',
    glow: 'rgba(255, 95, 109, 0.42)',
    iconKey: 'flag',
  },
  ghost: {
    band: 'ghost',
    word: 'Likely Ghost',
    line: 'Strong signs of a ghost or scam listing — be careful.',
    from: '#ff5f6d',
    to: '#ff2d55',
    solid: '#ff4763',
    deep: '#b00030',
    glow: 'rgba(255, 45, 85, 0.45)',
    iconKey: 'ghost',
  },
};

/** Human-readable signal names (popup mirror of overlay/labels.ts). */
export const SIGNAL_LABELS: Record<string, string> = {
  ai: 'AI-generated text',
  specificity: 'Specificity',
  buzzword: 'Buzzword density',
  scam: 'Scam signals',
  llm: 'LLM authenticity',
};

/** Strength tag from a reason's |signed| magnitude (mirrors ReasonsList). */
export function strengthLabel(absSigned: number): 'Weak' | 'Mild' | 'Strong' {
  if (absSigned >= 16) return 'Strong';
  if (absSigned >= 8) return 'Mild';
  return 'Weak';
}

/**
 * Set the runtime verdict accent custom properties on an element so the whole
 * subtree (ambient gradient, gauge, chips, CTA glow) recolours to the verdict.
 * Returns a style object spread onto the surface element.
 */
export function verdictVars(v: VerdictTheme): CSSProperties {
  // Custom properties aren't part of CSSProperties' known keys — cast so they
  // spread cleanly into a style object at the call sites.
  return {
    '--v-from': v.from,
    '--v-to': v.to,
    '--v-solid': v.solid,
    '--v-deep': v.deep,
    '--v-glow': v.glow,
  } as CSSProperties;
}
