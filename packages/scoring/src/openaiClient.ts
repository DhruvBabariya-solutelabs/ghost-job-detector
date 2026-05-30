/**
 * BYOK AI client factory for the scoring engine (OpenRouter, 2026-05).
 *
 * This is the ONLY file in @ghost/scoring that touches the raw apiKey string.
 * The API route calls makeAiClient(req.headers.get('x-openrouter-key')) and
 * passes the returned client to analyzeJob(posting, { ai }). The engine never
 * sees the raw key — the threat surface is structurally zero.
 *
 * Why OpenAI SDK against OpenRouter:
 *   OpenRouter exposes an OpenAI-compatible Chat Completions API at
 *   https://openrouter.ai/api/v1, so the same `openai` npm package works as
 *   the client — only baseURL + model identifier change. NOTE: OpenRouter does
 *   NOT support OpenAI's Responses API; the extractors use chat.completions.
 *
 * CLAUDE.md: "The OpenRouter key is read from x-openrouter-key request headers
 * only. Never the body, never the query string, never logged."
 *
 * Locked decisions:
 *   D-44: `openai` is a peerDependency of @ghost/scoring — the web app (the
 *   actual consumer) pulls it into the bundle.
 *   D-38: maxRetries: 0 is CRITICAL — SDK default 2 would 3× the 6s
 *   AbortController budget. Per-call AbortController in aiText.ts / llmEval.ts
 *   is the single deterministic abort point.
 *
 * Filename note: kept as `openaiClient.ts` (rename deferred) — the function
 * name change to `makeAiClient` covers all consumer references.
 */

import OpenAI from 'openai';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Constructs an OpenAI-SDK client pointed at OpenRouter from a raw BYOK header
 * value, or returns null when the key is absent or whitespace-only. The
 * engine's renormalization handles the null case — there is no separate
 * heuristics-only code path (CLAUDE.md Conventions).
 *
 * Attribution headers (`HTTP-Referer`, `X-Title`) are OpenRouter conventions:
 * they let the user see Ghost Job Detector traffic in their OpenRouter
 * dashboard and (for some free models) unlock free-tier access. Both are
 * static — neither leaks the BYOK key.
 */
export function makeAiClient(apiKey: string | null | undefined): OpenAI | null {
  if (!apiKey || !apiKey.trim()) return null;
  return new OpenAI({
    apiKey: apiKey.trim(),
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': 'https://ghost-job-detector.vercel.app',
      'X-Title': 'Ghost Job Detector',
    },
    maxRetries: 0, // CRITICAL: SDK default 2 would 3× the 6s AbortController budget.
  });
}
