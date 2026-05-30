/**
 * Missing-specificity heuristic extractor (ENG-02 + ENG-10).
 *
 * Checks 8 job-posting fields against per-field regex patterns. Each absent field
 * increments a `missing` counter; the floor curve (D-32) maps `missing` to a
 * ghostiness value capped at 0.9 — the small-startup false-positive guard.
 *
 * Also emits green-flag evidence for each PRESENT field (ENG-10), which Plan
 * 03-04's label.ts D-42 prioritization selects when `score >= 80`.
 *
 * Locked decisions:
 * - D-32: 8 fields, cap at 0.9 (NEVER 1.0). Floor curve:
 *     0 missing → 0.0; 1 → 0.10; 2 → 0.20
 *     3 → 0.45; 4 → 0.60; 5 → 0.75
 *     6 → 0.80; 7 → 0.85; 8 → 0.90
 *   A vague posting can NEVER single-handedly drive the score to "Likely Ghost Job"
 *   without buzzword OR scam OR AI signals also firing.
 * - D-40: Two evidence templates:
 *     red  — absent field: no evidenceQuote (absence-of-X has nothing to quote)
 *     green — present field: evidenceQuote is the liftQuote'd matched line
 * - D-42: Green-flag prioritization for score ≥ 80 (label.ts D-42 logic depends on
 *   this extractor emitting `+:` prefixed entries for each present field).
 * - D-34: Geographic salary heuristic DEFERRED to v2. This extractor does NOT vary
 *   the salary penalty by jurisdiction (CA/CO/NY). City names inside the `location`
 *   regex are match terms only — not conditional penalty modifiers.
 *
 * Evidence sigil convention (deterministic, parseable by Plan 03-04's label.ts):
 *   Absent field  → `-:${label}`                (e.g., `-:salary range`)
 *   Present field → `+:${label}:${liftQuote'd snippet}` (e.g., `+:salary range:...$120k...`)
 * The label.ts parser splits on the FIRST `:` to read the sigil (`+` or `-`), then
 * splits the remainder on the FIRST `:` to recover `label` and `quote`.
 *
 * Confidence is always 1.0 — the extractor ran and produced a definitive count.
 */

import type { JobPosting, SignalResult } from '@ghost/shared';
import { liftQuote } from './lift-quote.js';

// ---------------------------------------------------------------------------
// 8-field specificity table (D-32 / D-40 field labels — MUST match exactly)
// ---------------------------------------------------------------------------

/**
 * Each entry describes one job-posting dimension that, when absent, contributes
 * to the ghostiness score. Labels are locked by the D-40 table — do NOT rename.
 */
const SPECIFICITY_FIELDS = [
  {
    key: 'salary',
    label: 'salary range',
    // Matches: $120,000 / $120k / $80K-$100K / USD 90,000 / 90k-120k
    regex:
      /(?:\$\d[\d,]*(?:\.\d+)?[kK]?(?:\s*[-–]\s*\$?\d[\d,]*(?:\.\d+)?[kK]?)?|\d[\d,]+(?:\.\d+)?\s*[kK](?:\s*[-–]\s*\d[\d,]*[kK]?)?|\bUSD\s*\d[\d,]+)/i,
  },
  {
    key: 'stack',
    label: 'tech stack',
    // Matches common technology mentions
    regex:
      /\b(typescript|javascript|python|java|golang|go\b|rust|ruby|php|swift|kotlin|scala|c\+\+|c#|react|vue|angular|svelte|node\.?js|express|fastapi|django|rails|spring|postgres|mysql|mongodb|redis|kafka|aws|gcp|azure|docker|kubernetes|terraform|graphql|rest api|sql|nosql|linux)\b/i,
  },
  {
    key: 'yoe',
    label: 'years of experience',
    // Matches: 3 years / 5+ years / 2-4 yrs / 3+ yrs experience
    regex: /\b\d+\+?\s*([-–]\s*\d+\s*)?(year|yr)s?\b/i,
  },
  {
    key: 'location',
    label: 'office location',
    // Matches: remote / hybrid / on-site / major city names
    regex:
      /\b(remote|hybrid|on-?site|onsite|in-?office|san francisco|new york|seattle|austin|boston|chicago|los angeles|denver|atlanta|miami|dallas|portland|toronto|london|berlin|amsterdam|singapore)\b/i,
  },
  {
    key: 'benefits',
    label: 'benefits',
    // Matches benefits packages typically listed in legitimate postings
    regex:
      /\b(401k|401\(k\)|pto|paid time off|health\s*(insurance|care|plan|benefits?)|dental|vision|equity|stock\s*options?|vesting|parental\s*leave|sick\s*leave|vacation|life\s*insurance)\b/i,
  },
  {
    key: 'reporting',
    label: 'reporting structure',
    // Matches reporting relationships
    regex:
      /\b(reports?\s*to|reporting\s*to|direct\s*report|manage[ds]?\s*(a\s*team|directly)|vp\s*(of|engineering|product)|head\s*of|director\s*(of|,)|chief\s*(technology|product|executive)\s*officer|cto\b|cpo\b|ceo\b)\b/i,
  },
  {
    key: 'team',
    label: 'team',
    // Matches team/group mentions — signals the role has an organizational context
    regex:
      /\b(team\s*(of\s*\d+)?|squad|pod|crew|group|department|division|cross-?functional\s*team|engineering\s*team|product\s*team)\b/i,
  },
  {
    key: 'timeline',
    label: 'timeline',
    // Matches start date or onboarding timeline
    regex:
      /\b(start\s*(date|in|by|of)|begin\s*(in|on|by)|onboard(ing)?|join\s*(by|in|us\s*in)|target\s*(start|date)|q[1-4]\s*(20\d{2})|january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  },
] as const;

// ---------------------------------------------------------------------------
// D-32 ghostiness floor curve
// ---------------------------------------------------------------------------

/**
 * Map number of ABSENT fields to a ghostiness value (D-32 floor curve).
 * Cap at 0.9 — never 1.0 (small-startup false-positive guard per D-32).
 *
 * 0 missing → 0.00   (fully specified — very trustworthy specificity signal)
 * 1 missing → 0.10
 * 2 missing → 0.20
 * 3 missing → 0.45   (linear ramp: 0.3 + (missing-2)*0.15)
 * 4 missing → 0.60
 * 5 missing → 0.75
 * 6 missing → 0.80   (floor: 0.75 + (missing-5)*0.05)
 * 7 missing → 0.85
 * 8 missing → 0.90   // D-32 cap at 0.9, NEVER 1.0 (small-startup guard)
 */
function specGhostinessForMissing(missing: number): number {
  return missing <= 2
    ? 0.0 + missing * 0.1
    : missing <= 5
      ? 0.3 + (missing - 2) * 0.15
      : 0.75 + (missing - 5) * 0.05; // D-32 cap at 0.9, NEVER 1.0
}

// ---------------------------------------------------------------------------
// Extractor
// ---------------------------------------------------------------------------

/**
 * Extract missing-specificity signal from a job posting.
 *
 * Confidence is always 1.0 — the extractor unconditionally produces a definitive
 * field-presence count, unlike scam (D-33 binary off) or buzzword (D-30 zero-hit
 * confidence discussion). The labeler uses this full-confidence signal in every
 * weight renormalization, ensuring the specificity floor guard (D-32) always
 * contributes.
 *
 * @returns SignalResult with:
 *   - `key: 'specificity'`
 *   - `ghostiness`: D-32 floor curve value (0..0.90, never 1.0)
 *   - `confidence`: 1.0 (always — extractor ran and produced a definitive count)
 *   - `evidence`: array of `-:label` (absent) + `+:label:quote` (present) entries
 */
export function extractSpecificity(posting: JobPosting): SignalResult {
  const description = posting.description;
  const evidence: string[] = [];
  let missing = 0;

  for (const field of SPECIFICITY_FIELDS) {
    const match = field.regex.exec(description);
    if (match !== null) {
      // Present field: emit green-flag evidence with liftQuote'd snippet (D-40 green + D-42).
      const quote = liftQuote(description, match.index);
      evidence.push(`+:${field.label}:${quote}`);
    } else {
      // Absent field: emit red-template marker (no quote — absence has nothing to quote, D-40).
      evidence.push(`-:${field.label}`);
      missing += 1;
    }
  }

  const ghostiness = specGhostinessForMissing(missing);

  return { key: 'specificity', ghostiness, confidence: 1.0, evidence };
}
