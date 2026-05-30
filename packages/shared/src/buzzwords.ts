/**
 * Buzzword vocabulary for Phase 3's buzzword extractor (SHRD-04).
 *
 * This dictionary is frozen at module load — to add a term, edit this file.
 * Phase 3 owns regex/plural/variant matching (D-18) — do not compile regex
 * here. Phase 2 ships PURE DATA only.
 *
 * D-17: Categorized typed object (not a flat list). The four buckets let the
 * Phase-3 reason selector say "heavy urgency language (3 terms)" or "5
 * generic-praise buzzwords" instead of one undifferentiated count.
 *
 * Required seed terms (SHRD-04, all MUST be present somewhere in the dict):
 *   rockstar, ninja, fast-paced, self-starter, wear many hats,
 *   competitive comp, dynamic culture.
 *
 * Pitfall 3: the outer `as const` is load-bearing — without it, each category
 * value would be `string[]` (mutable, no literal narrowing). Keep `as const`.
 */

export const BUZZWORDS = {
  /** Generic "hero" praise — promises greatness without specifying competence. */
  generic: [
    'rockstar',
    'ninja',
    'wizard',
    'guru',
    'unicorn',
    'all-star',
  ],
  /** Pressure / pace language — signals churn culture or unrealistic timelines. */
  urgency: [
    'fast-paced',
    'asap',
    'urgent',
    'high-velocity',
    'high-pressure',
  ],
  /** Vague-scope language — broad role description without concrete deliverables. */
  vague: [
    'wear many hats',
    'self-starter',
    'dynamic culture',
    'team player',
    'thrive in ambiguity',
  ],
  /** Inflation / superlatives — comp / company-greatness rhetoric without specifics. */
  inflation: [
    'competitive comp',
    'top-tier',
    'best-in-class',
    'world-class',
    'industry-leading',
  ],
} as const;

/** Union of category names — `'generic' | 'urgency' | 'vague' | 'inflation'`. */
export type BuzzwordCategory = keyof typeof BUZZWORDS;
