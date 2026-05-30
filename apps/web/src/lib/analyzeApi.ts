/**
 * Real /api/analyze-job fetch client — Phase 6 replacement for analyzeStub.ts.
 *
 * Security invariants (T-06-06 / CLAUDE.md):
 * - The BYOK key is sent in the `x-openrouter-key` header only (ANALYZE_HEADER_KEY).
 * - No console output anywhere in this file — the key must never be logged.
 * - The thrown error on non-200 responses contains only the HTTP status code,
 *   never the key value.
 *
 * Wave-1 parallel-safety: this file imports only from `@ghost/shared` and
 * `@/lib/storage`. It does NOT import from `apps/web/src/app/api/` so
 * `npm run typecheck --workspace=apps/web` passes whether or not route.ts exists.
 *
 * @module apps/web/src/lib/analyzeApi
 */

import type { AnalyzeRequest, AnalyzeResponse } from '@ghost/shared';
import { ANALYZE_PATH, ANALYZE_HEADER_KEY } from '@ghost/shared';
import { getApiKey } from '@/lib/storage';

/**
 * Send a job posting to POST /api/analyze-job and return the scored result.
 *
 * Reads the BYOK key from localStorage via getApiKey(). An empty string is
 * the correct no-key signal — the server's makeAiClient returns null for
 * an empty header and the scoring engine automatically falls back to the
 * heuristics-only path via weight renormalization (no separate code path).
 *
 * Throws on any non-200 HTTP response. The thrown Error message contains only
 * the numeric status code (T-06-06 mitigation — key never appears in errors).
 * AnalyzeForm's existing try/catch catches this and renders kind: 'error_unknown'.
 *
 * @param input The JobPosting payload (same shape as analyzeStub accepted).
 * @returns A Promise resolving to the AnalyzeResponse from the scoring engine.
 */
export async function analyzeApi(input: AnalyzeRequest): Promise<AnalyzeResponse> {
  const key = getApiKey() ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [ANALYZE_HEADER_KEY]: key,
  };
  const res = await fetch(ANALYZE_PATH, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`analyze-job failed: ${res.status}`);
  }
  return (await res.json()) as AnalyzeResponse;
}
