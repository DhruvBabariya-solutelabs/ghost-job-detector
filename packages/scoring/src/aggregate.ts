/**
 * Weight aggregator for the Ghost Job scoring engine (ENG-06).
 *
 * Consumes a list of SignalResult[] from the five extractors and produces a
 * trust score (0..100) plus a per-signal breakdown array.
 *
 * Locked decisions:
 * - D-22: aggregate() receives one SignalResult per extractor call. Both AI
 *   signals (ai, llm) are parallel calls in Plan 03-05's analyzeJob; they arrive
 *   as entries in the same signals[] array — no array-flattening, no special casing.
 * - D-28: DEFAULT_WEIGHTS are the spec defaults from REQUIREMENTS ENG-06.
 *   Start with these values; tune ONLY if the calibration set (Plan 03-06) shows
 *   misclassification > 2/20. The calibration set is the regression gate, not the
 *   source of weights.
 * - D-31: Specificity-trumps-buzzwords adjustment lives in THIS file, NOT in any
 *   extractor. When the posting is highly specific (specificity.ghostiness <= 0.2)
 *   AND buzzword-heavy (buzzword.ghostiness >= 0.6), the buzzword weight is halved
 *   then all weights are re-renormalized to sum to 1.0. This is the FAANG-false-
 *   positive guard (PITFALLS "False Positives on Legitimate FAANG Postings").
 *
 * CRITICAL INVARIANT (CLAUDE.md Conventions lines 24-25):
 * The SAME code path runs whether `deps.ai` is null or an OpenAI instance.
 * When AI signals are absent, `present` contains 3 heuristic entries instead of 5.
 * The renormalization math is identical — just fewer entries in the sum. There is
 * NO separate heuristics-only code path. A new SignalKey added in v2 plugs into
 * DEFAULT_WEIGHTS without code-path changes beyond adding the key.
 *
 * Pattern D nuance (D-31 `.find()` usage):
 * `present.find(s => s.key === 'specificity')` and `.find(s => s.key === 'buzzword')`
 * are acceptable here because the follow-up `if (spec && buzz && ...)` guard provides
 * explicit undefined-handling (PATTERNS.md aggregate.ts §"D-31 uses .find() on present").
 * Pattern D's ban targets UNGUARDED `.find()` — this usage is explicitly guarded.
 */

import type { SignalBreakdownEntry, SignalKey, SignalResult } from '@ghost/shared';

// ---------------------------------------------------------------------------
// Default weights (D-28 — REQUIREMENTS ENG-06 spec defaults)
// ---------------------------------------------------------------------------

/**
 * Default signal weights. Sum to 1.0 over all five SignalKey values.
 * These are frozen at v1 ship; the calibration set (Plan 03-06) is the gate.
 */
const DEFAULT_WEIGHTS: Record<SignalKey, number> = {
  ai: 0.30,
  specificity: 0.25,
  buzzword: 0.20,
  scam: 0.15,
  llm: 0.10,
};
// NOTE: noUncheckedIndexedAccess makes DEFAULT_WEIGHTS[s.key] return number | undefined.
// s.key is typed SignalKey, so the key is always present in the Record<SignalKey, number>.
// Non-null assertion `!` is acceptable here; we also add `?? 0` as a belt-and-braces
// defensive fallback that documents the impossibility-of-undefined assumption explicitly.

// ---------------------------------------------------------------------------
// Aggregator
// ---------------------------------------------------------------------------

/**
 * Aggregate a list of signal results into a trust score and breakdown.
 *
 * @param signals - One SignalResult per extractor. degradedSignals (confidence 0)
 *   and scam-absent signals (confidence 0 per D-33) are filtered out before
 *   renormalization — this is the load-bearing CLAUDE.md Conventions line 24-25 step.
 * @returns `{ score, breakdown }` where:
 *   - `score`: 0..100 integer trust score (higher = more trustworthy)
 *   - `breakdown`: per-signal rows with post-renormalization weights and contributions
 */
export function aggregate(signals: SignalResult[]): {
  score: number;
  breakdown: SignalBreakdownEntry[];
} {
  // 1. Filter to present signals — confidence > 0 drops degradedSignals (Plan 03-01)
  //    and scam-absent signals (D-33 binary off) out of the renormalization sum.
  //    THIS IS THE LOAD-BEARING LINE for CLAUDE.md Conventions lines 24-25.
  //    "No OpenAI key" means ai/llm signals are absent → they never reach here.
  //    Same code path; fewer entries.
  const present = signals.filter((s) => s.confidence > 0);

  // 2. Degenerate edge: no present signals — return neutral midpoint, no division by zero.
  if (present.length === 0) {
    return { score: 50, breakdown: [] }; // degenerate edge — no signals; neutral midpoint
  }

  // 3. Renormalize default weights across present signals so they sum to 1.0.
  const presentWeightSum = present.reduce(
    (sum, s) => sum + (DEFAULT_WEIGHTS[s.key] ?? 0),
    0,
  );

  let weights = new Map<SignalKey, number>(
    present.map((s) => [s.key, (DEFAULT_WEIGHTS[s.key] ?? 0) / presentWeightSum]),
  );

  // 4. D-31: specificity-trumps-buzzwords adjustment.
  //    Pattern D nuance: .find() is acceptable here because the follow-up
  //    `if (spec && buzz && ...)` guard handles the undefined branch explicitly.
  const spec = present.find((s) => s.key === 'specificity');
  const buzz = present.find((s) => s.key === 'buzzword');

  if (spec !== undefined && buzz !== undefined && spec.ghostiness <= 0.2 && buzz.ghostiness >= 0.6) {
    // Posting is both highly specific AND buzzword-heavy — likely a marketing-y
    // real posting (FAANG job description style). Cut buzzword weight in half.
    const currentBuzzWeight = weights.get('buzzword');
    if (currentBuzzWeight !== undefined) {
      weights.set('buzzword', currentBuzzWeight * 0.5);
      // Re-renormalize all weights to sum to 1.0 after the adjustment.
      const newSum = [...weights.values()].reduce((a, b) => a + b, 0);
      weights = new Map(
        [...weights.entries()].map(([k, w]) => [k, w / newSum]),
      );
    }
  }

  // 5. Compute per-signal breakdown rows.
  //    ghostiness is scaled from 0..1 to 0..100 per Phase-2 D-13 wire shape.
  const breakdown: SignalBreakdownEntry[] = present.map((s) => {
    const w = weights.get(s.key) ?? 0;
    const ghost100 = s.ghostiness * 100;
    return {
      key: s.key,
      ghostiness: ghost100,
      confidence: s.confidence,
      weight: w,
      contribution: ghost100 * w,
    };
  });

  // 6. Final trust score: 100 - total weighted ghostiness (rounded to integer).
  const totalGhostiness = breakdown.reduce((sum, b) => sum + b.contribution, 0);
  return { score: Math.round(100 - totalGhostiness), breakdown };
}
