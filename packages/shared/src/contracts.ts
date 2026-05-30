/**
 * Wire schemas, domain types, and transport constants for @ghost/shared.
 *
 * This is the only place AnalyzeRequest, AnalyzeResponse, SignalResult, and
 * JobPosting are declared in the repo (CLAUDE.md — Conventions). Phase 6 is
 * the only consumer that calls `.safeParse`; downstream consumers (Phase 3
 * engine, Phase 4 extension, Phase 5 web UI) hold the inferred types.
 *
 * Locked decisions:
 * - D-13: AnalyzeResponse.signalBreakdown is an array of entries, not a
 *   named-keys object (supersedes REQUIREMENTS SHRD-02 sketch).
 * - D-14: AnalyzeResponse.reasons is structured ({text, signed, evidenceQuote?,
 *   signalKey}); green-flag reasons live in the same array with `signed > 0`.
 * - D-15: AnalyzeRequest is a *type alias* of JobPosting; no redeclaration.
 * - D-16: ANALYZE_HEADER_KEY and ANALYZE_PATH are the single source of truth
 *   for the BYOK header name and API path — no string literal duplicates,
 *   no OPENROUTER_API_KEY env-fallback constant (CLAUDE.md security rule).
 *   2026-05 amendment: BYOK provider switched from OpenAI direct to OpenRouter;
 *   header renamed from `x-openai-key` to `x-openrouter-key`.
 *
 * Notes for downstream:
 * - The only sanctioned validation surface is `JobPostingSchema.safeParse()`.
 *   No `isJobPosting` "trust me" assertion helper is exported. No `.parse()`
 *   shortcut either (Threat T-PHASE2-04 mitigation).
 * - `JobPosting` is the OUTPUT type (post-default). `company` and `location`
 *   are `string` (not `string | undefined`) — Phase 3 extractors do not need
 *   defensive `?? ''` (Pitfall 1).
 * - `JobPostingInput` is the unparsed input type for Phase 6's API route to
 *   type the raw request body BEFORE calling safeParse.
 */

import { z } from 'zod';
import type { RiskBand } from './risk.js';

/**
 * Wire schema for a job posting payload. Validated at the trust boundary only
 * (Phase 6's POST /api/analyze-job route).
 *
 * Bounds intent:
 * - title.min(1): non-empty single line.
 * - title.max(500): reject novel-length titles.
 * - company/location.max(300).default(''): permit absent on partial listings;
 *   Phase 3 extractors see a guaranteed string (Pitfall 1).
 * - description.min(20): reject inputs too short to be a real posting and
 *   waste an OpenAI call.
 * - description.max(50_000): V5 trust-boundary DoS cap (ASVS V5.1.1 / V5.1.3).
 *   The engine separately enforces a ~6_000-char inner cap for the LLM
 *   prompt-injection defense (Phase 3 / ENG-12).
 * - sourceUrl.url().optional(): extension knows the URL; web /analyze textarea
 *   path may not. Keep Zod-3 method-chain form `z.string().url()` — do NOT
 *   use Zod-4-style `z.url()` (CLAUDE.md locks Zod 3.x).
 */
export const JobPostingSchema = z.object({
  title: z.string().min(1).max(500),
  company: z.string().max(300).default(''),
  location: z.string().max(300).default(''),
  description: z.string().min(20).max(50_000),
  sourceUrl: z.string().url().optional(),
});

/** Post-parse type (defaults applied). What every consumer holds. */
export type JobPosting = z.infer<typeof JobPostingSchema>;

/**
 * Pre-parse type. Use to type the unparsed request body in Phase 6 before
 * calling `JobPostingSchema.safeParse(body)`. `company` / `location` are
 * `string | undefined` here (input shape), then become `string` after parse.
 */
export type JobPostingInput = z.input<typeof JobPostingSchema>;

/** Wire alias (D-15) — `AnalyzeRequest` is the same shape as `JobPosting`. */
export type AnalyzeRequest = JobPosting;

/**
 * Closed enumeration of extractor signal keys. The aggregator never branches
 * on key identity — every signal has the same SignalResult shape (CLAUDE.md /
 * three load-bearing seams). `llm` is the OpenAI judge; the four others are
 * pure heuristics.
 */
export type SignalKey = 'buzzword' | 'specificity' | 'scam' | 'ai' | 'llm';

/**
 * Uniform output shape every extractor produces (SHRD-03). Locked.
 *
 * - `ghostiness`: 0..1 raw signal strength (higher = more likely ghost).
 * - `confidence`: 0..1 — how strongly the extractor stands behind ghostiness.
 *   Weight renormalization for "no OpenAI key" multiplies confidence in.
 * - `evidence`: quoted phrases from the description that triggered the signal.
 */
export interface SignalResult {
  key: SignalKey;
  ghostiness: number;
  confidence: number;
  evidence: string[];
}

/**
 * Per-signal row in the wire response (D-13). Array form — when AI is absent,
 * the aggregator emits fewer entries; the UI iterates the array. No `null`
 * gaps, no special-casing of missing keys.
 *
 * - `ghostiness`: 0..100 on the wire (rescaled from 0..1).
 * - `weight`: 0..1, post-renormalization.
 * - `contribution`: ghostiness * weight (UI bar fill).
 */
export interface SignalBreakdownEntry {
  key: SignalKey;
  ghostiness: number;
  confidence: number;
  weight: number;
  contribution: number;
}

/**
 * Structured reason bullet (D-14). UI renders 3–5 of these.
 *
 * - `text`: plain-English bullet.
 * - `signed`: contribution toward trust (positive = green flag, negative =
 *   ghost-leaning). UI shows as +15 / -12 chip.
 * - `evidenceQuote`: optional — heuristics that detect absence of something
 *   (e.g., "no salary disclosed") omit this.
 * - `signalKey`: ties the reason back to its row in `signalBreakdown` so the
 *   UI can highlight both together.
 */
export interface Reason {
  text: string;
  signed: number;
  evidenceQuote?: string;
  signalKey: SignalKey;
}

/**
 * Wire response from POST /api/analyze-job. Shape locked by Phase 1 D-06
 * (RiskBand keys) and Phase 2 D-13 / D-14 (signalBreakdown / reasons shape).
 *
 * - `score`: 0..100, TRUST (higher = more trustworthy). Inverse of ghostiness.
 * - `risk`: discrete band derived from score via bandFor() in @ghost/shared/risk.
 * - `meta.usedAi`: provider-neutral — true when an AI client was bound for this
 *   request (currently OpenRouter). Renamed from `usedOpenAi` in the 2026-05
 *   OpenRouter switch; the field name no longer hardcodes a vendor.
 * - `meta.durationMs`: server-measured turnaround for the API call; optional
 *   so streaming-future variants can omit it.
 */
export interface AnalyzeResponse {
  score: number;
  risk: RiskBand;
  reasons: Reason[];
  signalBreakdown: SignalBreakdownEntry[];
  meta: {
    usedAi: boolean;
    model: string;
    durationMs?: number;
  };
}

/**
 * Header name for the BYOK OpenRouter key (D-16, 2026-05 amendment).
 * The single source of truth for every surface that issues or reads the
 * analyze request:
 *   - apps/extension service worker (`fetch(ANALYZE_PATH, { headers: { [ANALYZE_HEADER_KEY]: key } })`)
 *   - apps/extension options page (writing the user-entered key)
 *   - apps/web settings drawer (same)
 *   - apps/web API route (reading it via `req.headers.get(ANALYZE_HEADER_KEY)`)
 *
 * There is intentionally NO `OPENROUTER_API_KEY` env-fallback constant exported
 * here — CLAUDE.md forbids server-side env fallback. The key MUST arrive
 * via this header, never via body / query string / env.
 */
export const ANALYZE_HEADER_KEY = 'x-openrouter-key' as const;

/** Wire path for POST /api/analyze-job (D-16). Imported by SW + web fetch sites. */
export const ANALYZE_PATH = '/api/analyze-job' as const;

/** Absolute base URL for the Vercel deployment (D-16). Used by the extension
 * service worker only — browser-context fetch (analyzeApi.ts) uses a same-origin
 * relative path. No trailing slash.
 */
// TEMPORARY (hackathon demo): points at local Next.js dev server. Flip back to
// 'https://ghost-job-detector.vercel.app' before deploying to Vercel.
export const ANALYZE_BASE_URL = 'http://localhost:3000' as const;
