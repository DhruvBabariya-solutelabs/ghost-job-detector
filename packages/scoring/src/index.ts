/**
 * Public API for @ghost/scoring. Exports `analyzeJob(posting, deps): Promise<AnalyzeResponse>`
 * and the `AnalyzeDeps` interface. Consumed by Phase-6's
 * apps/web/src/app/api/analyze-job/route.ts.
 *
 * Locked decisions:
 * - D-22: parallel call topology — extractAiText + extractLlmEval run concurrently via
 *   `Promise.all([...])` with per-promise `.catch(() => degradedSignal(key))` for granular
 *   degradation. One AI failure does NOT poison the other signal.
 * - D-25: heuristic gate `isLikelyJobPosting` SHORT-CIRCUITS before any AI call.
 *   T-PHASE3-05 mitigation half. Zero OpenAI cost/latency on non-posting inputs.
 * - D-26: non-posting response shape — score: 50, risk: 'caution', single dominant-negative
 *   reason, signalBreakdown: []. Built by the module-private `notAJobPostingResponse` helper.
 * - D-43: this file (index.ts) is the public API file — the ONLY entry point for @ghost/scoring.
 * - D-44: `openai` is a peerDependency of @ghost/scoring. Typed here as `import type OpenAI`;
 *   the constructor lives in packages/scoring/src/openaiClient.ts (Plan 03-01).
 * - D-45: `AnalyzeDeps` is defined in THIS file (engine-internal DI shape), NOT in @ghost/shared.
 *
 * CRITICAL INVARIANTS (tsc cannot enforce):
 * 1. Engine NEVER throws on AI failure — only on programmer error per CONTEXT D-38.
 *    The `.catch(() => degradedSignal(key))` on each Promise.all entry is defense-in-depth:
 *    Plan 03-03's extractors already catch internally; this outer .catch is the second layer.
 * 2. The SAME code path runs whether deps.ai is null or an OpenAI instance —
 *    CLAUDE.md Conventions lines 24-25 LOAD-BEARING. The only branch is
 *    `Promise.all([...]) vs []` to get the AI signals; the aggregator + labeler are
 *    called identically with 3 or 5 signals.
 * 3. Engine NEVER logs / reads apiKey / caches. deps.ai is an opaque handle per
 *    CONTEXT line 492. Plan 03-01's makeAiClient is the only consumer of the raw apiKey.
 */

import type { AnalyzeResponse, JobPosting, SignalResult } from '@ghost/shared';
import type OpenAI from 'openai'; // type-only; constructor lives in openaiClient.ts (D-44)

import { aggregate } from './aggregate.js';
import { label, DOMINANT_NEGATIVE_REASON } from './label.js';
import { degradedSignal } from './extractors/types.js';
import { isLikelyJobPosting } from './extractors/triage.js';
import { extractBuzzword } from './extractors/buzzword.js';
import { extractSpecificity } from './extractors/specificity.js';
import { extractScam } from './extractors/scam.js';
import { extractAiText } from './extractors/aiText.js';
import { extractLlmEval } from './extractors/llmEval.js';

/**
 * Engine dependency-injection shape (CONTEXT D-45 — engine-internal, NOT in @ghost/shared).
 *
 * @property ai  - Pre-bound AI client (OpenAI SDK pointed at OpenRouter); constructed per
 *                 request by the API route via packages/scoring/src/openaiClient.ts
 *                 makeAiClient(headerValue). The engine treats this as an opaque handle —
 *                 never reads `.apiKey`, never inspects headers.
 * @property now - Optional time-source injection. Defaults to Date.now. Plan 03-06's calibrate.ts
 *                 uses this to make meta.durationMs deterministic in fixture runs.
 */
export interface AnalyzeDeps {
  ai: OpenAI | null;
  now?: () => number;
}

/**
 * AI model routed via OpenRouter — `openai/gpt-4o-mini` keeps the same
 * underlying model the engine was tuned against; OpenRouter just sits in
 * front of OpenAI's endpoint. Module-private; NOT a wire contract.
 */
const AI_MODEL = 'openai/gpt-4o-mini';

/**
 * Build the dominant-negative response for non-posting inputs (D-25 / D-26 short-circuit).
 *
 * Returns a wire-shape-valid AnalyzeResponse. No extractor ran; signalBreakdown is empty.
 *
 * Two distinct paths produce a dominant-negative reason (different signalKey, identical text):
 * - Gate-fail path (THIS helper): signalKey: 'specificity' per CONTEXT D-26.
 * - LLM-backstop path (Plan 03-04's label.ts): signalKey: 'llm' per D-40 llm-backstop row.
 * Both spread `DOMINANT_NEGATIVE_REASON` from label.ts — text is byte-for-byte identical
 * (BLOCKER 1 single-source-of-truth fix; Plan 03-06 fixture string-equality assertions rely on this).
 */
function notAJobPostingResponse(model: string, start: number, deps: AnalyzeDeps): AnalyzeResponse {
  return {
    score: 50, // D-26 neutral midpoint
    risk: 'caution',
    reasons: [
      // Spread the canonical Reason constant and override only signalKey (BLOCKER 1 fix).
      // Do NOT redeclare the text inline — it lives only in label.ts as single source of truth.
      { ...DOMINANT_NEGATIVE_REASON, signalKey: 'specificity' },
    ],
    signalBreakdown: [],
    meta: {
      usedAi: false,
      model: deps.ai !== null ? model : 'heuristics-only',
      durationMs: (deps.now ?? Date.now)() - start,
    },
  };
}

/**
 * Trust-score a job posting.
 *
 * @param posting - Validated JobPosting (Phase-6 API route calls JobPostingSchema.safeParse
 *                  before passing here). Description has been bounded at 50_000 chars.
 * @param deps    - `ai` is the pre-bound OpenAI client (null when BYOK absent).
 *                  `now` is the optional time-source injection seam (Plan 03-06 uses it for
 *                  deterministic durationMs in fixture runs — no clock-mocking needed).
 * @returns       AnalyzeResponse with score 0..100, risk band, 3-5 reasons, signal breakdown.
 *
 * Note on meta.usedAi: set to `deps.ai !== null` — reflects whether a client was AVAILABLE,
 * not whether AI calls succeeded. If both AI calls degrade (confidence: 0), usedAi is still
 * true. Planner-discretion per CONTEXT specifics lines 376-379.
 */
export async function analyzeJob(
  posting: JobPosting,
  deps: AnalyzeDeps,
): Promise<AnalyzeResponse> {
  const start = (deps.now ?? Date.now)();

  // STEP 1: D-25 heuristic gate (zero-cost short-circuit before any AI call).
  // T-PHASE3-05 mitigation half. Saves both AI calls on non-posting inputs.
  if (!isLikelyJobPosting(posting)) {
    return notAJobPostingResponse(AI_MODEL, start, deps);
  }

  // STEP 2: Run three deterministic heuristic extractors synchronously.
  // They share no I/O — no Promise.all needed. ~20ms total per AI-SPEC §4 latency budget.
  const heuristic: SignalResult[] = [
    extractBuzzword(posting),
    extractSpecificity(posting),
    extractScam(posting),
  ];

  // STEP 3: Run two OpenAI calls IN PARALLEL when a client is bound (D-22 / AI-SPEC §4b).
  // Per-promise .catch() guarantees granular degradation — one failure does NOT poison the
  // other (CONTEXT D-22). This is DEFENSE IN DEPTH: Plan 03-03's extractors already catch
  // internally; the outer .catch is the second layer for any non-defensive throw paths.
  // NOT Promise.allSettled — allSettled wraps results in value/reason envelopes (AI-SPEC §4b
  // REJECTED ALTERNATIVE 1). NOT sequential await (REJECTED ALTERNATIVE 2).
  const aiSignals: SignalResult[] = deps.ai
    ? await Promise.all([
        extractAiText(posting, deps.ai).catch(() => degradedSignal('ai')),
        extractLlmEval(posting, deps.ai).catch(() => degradedSignal('llm')),
      ])
    : [];

  // Combine all signals once — reused for both aggregate() and label() (minor clarity win).
  const allSignals: SignalResult[] = [...heuristic, ...aiSignals];

  // STEP 4: Aggregate — weight renormalization across present signals (confidence > 0).
  // "No AI" means 3 heuristic entries instead of 5. SAME code path (CLAUDE.md lines 24-25).
  const aggregated = aggregate(allSignals);

  // STEP 5: Label — maps score to risk band (via bandFor in Plan 03-04) + selects 3-5 reasons.
  // Third arg provides raw SignalResult[] so label.ts can access evidence[] for templates.
  const labeled = label(aggregated, allSignals, posting);

  // STEP 6: Bundle into wire-shape AnalyzeResponse.
  return {
    score: aggregated.score,
    risk: labeled.risk,
    reasons: labeled.reasons,
    signalBreakdown: aggregated.breakdown,
    meta: {
      usedAi: deps.ai !== null,
      model: deps.ai !== null ? AI_MODEL : 'heuristics-only',
      durationMs: (deps.now ?? Date.now)() - start,
    },
  };
}

export { makeAiClient } from './openaiClient.js';
