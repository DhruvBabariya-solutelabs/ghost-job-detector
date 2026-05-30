/**
 * Buzzword-density heuristic extractor (ENG-01).
 *
 * Consumes the `BUZZWORDS` categorized dictionary from `@ghost/shared` (Phase 2
 * ships pure data; Phase 3 owns regex compilation per D-18). Compiles one
 * `RegExp` per category at module load — never inside `extractBuzzword`.
 *
 * Locked decisions:
 * - D-18: Phase 3 owns regex/plural/variant matching. `packages/shared/src/buzzwords.ts`
 *   stays as plain string arrays with zero regex. This file IS the regex compilation site.
 * - D-30: Logarithmic ghostiness cap — `min(0.9, log2(count + 1) / log2(8))`. Past 8
 *   hits the cap saturates at 0.9. Prevents FAANG-style postings (3-5 marketing-y terms
 *   in a long, otherwise-specific listing) from being mis-scored as ghost jobs. The SCALE
 *   constant (log2(8)) may be tuned against the calibration set in Plan 03-06.
 * - D-40: Evidence quotes via `liftQuote` (D-41 helper). Templates ("Heavy {category}
 *   language ({count} terms)") live in Plan 03-04's label.ts; this extractor emits
 *   raw liftQuote'd snippets so the labeler can construct the full Reason.
 *
 * Multi-word phrase handling (CONTEXT line 220 / PATTERNS.md §"Consumer pattern"):
 * BUZZWORDS.vague contains 'wear many hats' (a phrase with internal spaces). Strategy:
 * escape each term via `escapeRegex` and join with `|`. The alternation `\b(wear many
 * hats|...)\b` matches the phrase literally because `\b` anchors at the outer edges and
 * whitespace inside the phrase is matched as-is. Single-word terms get the same treatment.
 *
 * Zero-hit confidence (CONTEXT D-30 / D-33 discussion):
 * Returns `confidence: 0.5` on zero hits. Rationale: absence of buzzwords IS informative
 * (a posting with no marketing-y language trends toward authentic), so the buzzword signal
 * should remain in the aggregator's weight renormalization even when count = 0.
 * This differs from scam (D-33 binary off) because buzzword absence is a weak positive
 * signal, not a neutral void.
 *
 * Evidence cap: top 5 liftQuote snippets (highest-priority per category order).
 * Bounded to prevent excessively large evidence arrays on keyword-stuffed descriptions.
 */

import { BUZZWORDS } from '@ghost/shared';
import type { BuzzwordCategory, JobPosting, SignalResult } from '@ghost/shared';
import { liftQuote } from './lift-quote.js';

// ---------------------------------------------------------------------------
// Module-load regex compilation (D-18 — compile once, reuse per call)
// ---------------------------------------------------------------------------

/** Escape all regex metacharacters in a literal string. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * One compiled RegExp per BuzzwordCategory.
 * Built via `Object.entries(BUZZWORDS)` — never via `BUZZWORDS[cat]` direct
 * indexing, which returns `readonly string[] | undefined` under noUncheckedIndexedAccess
 * (Pattern D watchpoint from PATTERNS.md §"extractors/buzzword.ts").
 *
 * The `gi` flags: `g` — collect ALL matches via matchAll; `i` — case-insensitive.
 */
const BUZZWORD_REGEX: Record<BuzzwordCategory, RegExp> = Object.fromEntries(
  (Object.entries(BUZZWORDS) as [BuzzwordCategory, readonly string[]][]).map(([cat, terms]) => [
    cat,
    new RegExp(`\\b(${terms.map(escapeRegex).join('|')})\\b`, 'gi'),
  ]),
) as Record<BuzzwordCategory, RegExp>;

// ---------------------------------------------------------------------------
// D-30 logarithmic ghostiness formula
// ---------------------------------------------------------------------------

/** Maximum ghostiness emitted by the buzzword extractor (never drives score to scam-band alone). */
const MAX_BUZZ_GHOSTINESS = 0.9;

/**
 * Tunable scale constant (D-30 line 110).
 * log2(8) means 8 total term hits saturates the cap. May be tuned against
 * the calibration set in Plan 03-06 — the constant name makes the intent clear.
 */
const SCALE = Math.log2(8);

/** Map total buzzword hit count to a capped ghostiness value (D-30). */
function buzzGhostinessForCount(count: number): number {
  return Math.min(MAX_BUZZ_GHOSTINESS, Math.log2(count + 1) / SCALE);
}

// ---------------------------------------------------------------------------
// Maximum evidence entries to emit per call
// ---------------------------------------------------------------------------
const MAX_EVIDENCE = 5;

// ---------------------------------------------------------------------------
// Extractor
// ---------------------------------------------------------------------------

/**
 * Extract buzzword-density signal from a job posting.
 *
 * @returns SignalResult with:
 *   - `key: 'buzzword'`
 *   - `ghostiness`: D-30 logarithmic cap (0..0.9)
 *   - `confidence`: 1.0 when ≥1 hit; 0.5 when 0 hits (see JSDoc above)
 *   - `evidence`: top-5 liftQuote'd snippets from matched terms
 */
export function extractBuzzword(posting: JobPosting): SignalResult {
  const description = posting.description;
  const evidence: string[] = [];
  let totalCount = 0;

  // Iterate category → regex pairs via for..of (Pattern D — no BUZZWORDS[cat] indexing).
  for (const [, regex] of Object.entries(BUZZWORD_REGEX)) {
    // Reset lastIndex for the global regex before each call.
    regex.lastIndex = 0;
    for (const match of description.matchAll(regex)) {
      totalCount += 1;
      // Cap evidence array to avoid unbounded growth on keyword-stuffed inputs.
      if (evidence.length < MAX_EVIDENCE) {
        // match.index is number under noUncheckedIndexedAccess because matchAll
        // always sets index on RegExpMatchArray; defensive fallback to 0.
        evidence.push(liftQuote(description, match.index ?? 0));
      }
    }
  }

  const ghostiness = buzzGhostinessForCount(totalCount);
  const confidence = totalCount > 0 ? 1.0 : 0.5;

  return { key: 'buzzword', ghostiness, confidence, evidence };
}
