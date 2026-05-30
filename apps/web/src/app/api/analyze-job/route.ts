/**
 * POST /api/analyze-job — THE ONLY API ROUTE in this application.
 *
 * BYOK: the OpenRouter key is read from the `x-openrouter-key` request header
 * only. It is never logged, never echoed in any response body, never stored.
 *
 * Security invariants (CLAUDE.md + T-06-01/T-06-02 mitigations):
 * - No `console.*` calls in this file — prevents accidental key leaks in Vercel logs.
 * - `apiKeyHeader` is a local const passed only to makeAiClient; reference ends there.
 * - Catch block returns a static string — err.message is never serialized or logged.
 * - No OPENROUTER_API_KEY env fallback — BYOK only, by design (CLAUDE.md forbids it).
 *
 * CORS: wildcard `*` is correct for v1 (D-66 resolution). Handles chrome-extension://*
 * and the Vercel origin with no maintenance burden. No credentials mode, no session state.
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { JobPostingSchema, ANALYZE_HEADER_KEY } from '@ghost/shared';
import { analyzeJob, makeAiClient } from '@ghost/scoring';

/** CORS headers applied to every response, including preflight. */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': `content-type, ${ANALYZE_HEADER_KEY}`,
  'Access-Control-Max-Age': '86400',
} as const;

/** OPTIONS preflight handler — returns 204 with CORS headers. */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** POST handler — validates body, reads BYOK header, calls scoring engine, returns result. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Step a: Parse body — treat unparseable JSON as a 400.
    const body: unknown = await req.json().catch(() => null);
    if (body === null) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Step b: Zod validation at the trust boundary (T-06-03 mitigation).
    const parsed = JobPostingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Step c: Read BYOK key — local const only; never logged, never echoed.
    const apiKeyHeader = req.headers.get(ANALYZE_HEADER_KEY);

    // Step d: Build AI client (OpenRouter-backed; returns null when key is
    // absent/whitespace). Engine handles null via weight renormalization — no
    // separate code path needed.
    const ai = makeAiClient(apiKeyHeader);

    // Step e: Run scoring engine. Engine NEVER throws on AI failure — degradedSignal
    // paths handle all AI errors internally. No extra timeout wrapper needed here;
    // the 6s AbortController is already inside the extractors (D-38).
    const result = await analyzeJob(parsed.data, { ai });

    // Step f: Return 200 with unmodified engine output (meta.usedAi reflects key presence).
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch {
    // Static error string only — err.message is never serialized (T-06-02 mitigation).
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
