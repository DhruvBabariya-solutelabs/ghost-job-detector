/**
 * Heuristic triage gate for the scoring engine (D-25 / D-26).
 *
 * `isLikelyJobPosting` runs FIRST inside `analyzeJob` (Plan 03-05), before any
 * OpenAI call is issued — this is the T-PHASE3-05 heuristic-half mitigation.
 * When it returns `false`, the engine short-circuits to the D-26 dominant-negative
 * response shape (score: 50, risk: 'caution', reasons: [{text: "This doesn't look
 * like a job posting — score may not be meaningful", signed: 0, signalKey: 'specificity'}],
 * signalBreakdown: []) that Plan 03-04's label.ts constructs.
 *
 * Locked decisions:
 * - D-25: two-clause AND gate — description length ∈ [200, 50_000] AND a job-terms
 *   regex matches. Zero OpenAI cost. Runs synchronously before any extractor.
 * - D-26: when this returns false, analyzeJob returns the dominant-negative shape
 *   without invoking any extractor (heuristic, AI, or otherwise).
 *
 * Keyword list rationale: 11 conservative job-posting markers, case-insensitive.
 * Every real LinkedIn / Indeed posting contains at least one. Adversarial DoS-shape
 * inputs (200+ chars of lorem ipsum with no job-term) trip the regex test →
 * return false → short-circuit before any AI call (T-PHASE3-05).
 * Resume false-positive: resumes commonly contain "engineer" / "apply" — this is
 * the heuristic-false-positive case that the LLM `is_job_posting` backstop in
 * Plan 03-03 (extractLlmEval) catches.
 */

import type { JobPosting } from '@ghost/shared';

/** Job-posting marker terms — compiled once at module load (Pattern from contracts.ts). */
const JOB_TERMS =
  /\b(role|engineer|manager|developer|designer|analyst|responsibilities|requirements|qualifications|apply|position|hiring)\b/i;

/**
 * Returns `true` when `p.description` looks like a real job posting.
 *
 * Two-clause guard (D-25):
 * 1. Length ∈ [200, 50_000] — rules out single-word inputs and DoS-shaped payloads.
 * 2. At least one job-posting marker matches — rules out lorem-ipsum / song-lyrics.
 */
export function isLikelyJobPosting(p: JobPosting): boolean {
  const d = p.description;
  return d.length >= 200 && d.length <= 50_000 && JOB_TERMS.test(d);
}
