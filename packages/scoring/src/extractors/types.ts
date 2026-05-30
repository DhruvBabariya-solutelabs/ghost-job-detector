/**
 * Internal helpers for the scoring engine's extractor layer.
 *
 * The AI extractors (`aiText`, `llmEval`) ALWAYS return `degradedSignal` on
 * AbortError, HTTP error, or Structured Outputs refusal. Synchronous heuristic
 * extractors (buzzword, specificity, scam) never need it.
 *
 * D-22: A failed AI call returns `confidence: 0` and drops out of weight
 *   renormalization — the surviving signals still contribute.
 * D-38: Every soft-fail path returns this helper, never a thrown exception.
 */

import type { SignalKey, SignalResult } from '@ghost/shared';

/**
 * Returns a soft-fail SignalResult. The aggregator filters signals with
 * `confidence === 0` out of weight renormalization (CONTEXT D-22), so this
 * signal contributes zero to the final score and drops from signalBreakdown[].
 */
export function degradedSignal(key: SignalKey): SignalResult {
  return { key, ghostiness: 0, confidence: 0, evidence: [] };
}
