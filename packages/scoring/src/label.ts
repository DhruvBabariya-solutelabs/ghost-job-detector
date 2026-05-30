/**
 * Score-to-band labeler and reason selector for the Ghost Job scoring engine.
 *
 * Consumes the aggregator's `{ score, breakdown }` plus the raw SignalResult[]
 * to produce a risk band and 3-5 plain-English reasons with evidence quotes.
 *
 * Locked decisions:
 * - D-19: `bandFor` from @ghost/shared is the ONLY way to derive `risk` from `score`.
 *   The threshold literals 80/50/20 MUST NOT appear in this file (T-PHASE3-06 grep
 *   enforcement — Phase-2 single-source-of-truth rule extends to Phase 3).
 *   The D-42 green-flag trigger uses `bandFor(aggregated.score) === 'legitimate'` which
 *   routes the threshold lookup through bandFor itself, eliminating the literal 80.
 * - D-25: LLM-backstop dominant-negative reason. When the llm signal has confidence > 0
 *   AND < 1 (Plan 03-03's llmEval sets confidence: 0.5 when is_job_posting === false),
 *   insert DOMINANT_NEGATIVE_REASON as reasons[0] and demote other reasons.
 * - D-26: The score-50 short-circuit for the heuristic gate fires in Plan 03-05's
 *   analyzeJob BEFORE this file is called. THIS file only handles the LLM-backstop
 *   path (heuristic gate passed but LLM determined it may not be a posting).
 * - D-39: Reasons are templated from signal breakdown — NEVER invented by the LLM.
 *   The LLM's only contribution is the bounded ≤200-char `assessment_summary` field
 *   interpolated into the `llm.red` template. (Critical Failure Mode #5 defense.)
 * - D-40: Per-signal-direction template table below. Specificity emits both red
 *   (absent field) and green (present field with evidenceQuote) reasons.
 * - D-41: Evidence quotes are already liftQuote-formatted by Plan 03-02's extractors.
 *   This file parses the sigil-prefixed evidence strings; it does NOT call liftQuote.
 * - D-42: Green-flag prioritization for the legitimate band (score ≥ 80 per bandFor).
 *   Filters candidates to signed > 0 first; pads with least-negative reds if < 3 greens.
 *
 * Sigil conventions (Plan 03-02's extractors, consumed here):
 *   Specificity: `+:label:quote` (present) or `-:label` (absent)
 *   Scam:        `${kind}::${quote}` where kind is one of the 5 enumerated strings
 *   Buzzword:    plain liftQuote snippets (no sigil — first evidence entry is the quote)
 *
 * Green-flag signed-contribution formula (plan 03-04 decision):
 *   positiveContribution = (1 - specSignal.ghostiness) * specBreakdown.weight * 100
 *   perFieldSigned = clamp(positiveContribution / presentCount, MIN_SIGNED_MAGNITUDE, 15)
 *   Each present-field Reason gets signed = Math.round(perFieldSigned)
 *   If presentCount === 0, no green Reasons emitted (division-by-zero guard).
 *
 * Pattern D nuance: `signals.find(s => s.key === 'llm')` uses .find() because the
 * follow-up `if (llmSig !== undefined && ...)` guard handles undefined explicitly.
 * Same rationale as aggregate.ts D-31 .find() usage.
 */

import { bandFor } from '@ghost/shared';
import type {
  BuzzwordCategory,
  JobPosting,
  Reason,
  RiskBand,
  SignalBreakdownEntry,
  SignalKey,
  SignalResult,
} from '@ghost/shared';

// ---------------------------------------------------------------------------
// Reason-selection constants (D-39 / ENG-08)
// ---------------------------------------------------------------------------

/** Drop reason candidates whose absolute signed contribution is below this floor. */
const MIN_SIGNED_MAGNITUDE = 3;
/** Minimum number of reasons to emit (ENG-08). */
const MIN_REASONS = 3;
/** Maximum number of reasons to emit (ENG-08). */
const MAX_REASONS = 5;

// ---------------------------------------------------------------------------
// D-40 reason templates (Pattern C — as const; author-controlled literals)
// All strings are plain ASCII English, ≤ 140 chars, no jargon, no emoji.
// ---------------------------------------------------------------------------

const REASON_TEMPLATES = {
  buzzword: {
    red: (category: string, count: number) => `Heavy ${category} language (${count} terms)`,
  },
  specificity: {
    red: (fieldLabel: string) => `Description omits ${fieldLabel}`,
    green: (fieldLabel: string) => `${capitalizeFirst(fieldLabel)} disclosed`,
  },
  scam: {
    messagingApp: () => 'Asks for contact via WhatsApp, Telegram, or similar',
    externalEmail: () => 'External email contact',
    urgency: () => 'Urgent hiring pressure',
    unrealisticComp: () => 'Unrealistic compensation claim',
    vagueCompany: () => 'Vague company description',
    equipmentPurchase: () => 'Upfront equipment or fee request',
  },
  ai: {
    red: () => 'Reads as AI-generated boilerplate',
  },
  llm: {
    red: (shortPhrase: string) => `Authenticity assessment: ${shortPhrase}`,
  },
} as const;

// ---------------------------------------------------------------------------
// D-25 / D-26 dominant-negative reason (exported — Plan 03-05 imports this)
// ---------------------------------------------------------------------------

/**
 * Dominant-negative reason inserted as reasons[0] when the LLM backstop trips
 * (llm signal confidence > 0 and < 1 — Plan 03-03 sets 0.5 when is_job_posting === false).
 * Exported so Plan 03-05's notAJobPostingResponse helper can reference the same text
 * without duplicating the string (BLOCKER 1 single-source-of-truth fix).
 */
export const DOMINANT_NEGATIVE_REASON: Reason = {
  text: "This doesn't look like a job posting - score may not be meaningful",
  signed: 0,
  signalKey: 'llm',
};

// ---------------------------------------------------------------------------
// Category label mapping (D-40 last paragraph — BUZZWORDS key → display label)
// Uses a switch for exhaustive type-narrowing under noUncheckedIndexedAccess.
// ---------------------------------------------------------------------------

function capitalizeFirst(s: string): string {
  if (s.length === 0) return s;
  const first = s[0];
  return first !== undefined ? first.toUpperCase() + s.slice(1) : s;
}

/**
 * Maps BuzzwordCategory keys to D-40 display labels.
 * Currently unused because buzzword.ts evidence entries do not carry category metadata
 * (they are plain liftQuote snippets). Retained for v2 when buzzword.ts evidence may
 * include category — prefixed with `_` to suppress the unused-variable lint warning.
 */
function _categoryLabel(cat: BuzzwordCategory): string {
  switch (cat) {
    case 'generic':
      return 'generic-praise';
    case 'urgency':
      return 'urgency';
    case 'vague':
      return 'vague-scope';
    case 'inflation':
      return 'comp-inflation';
  }
}

void (_categoryLabel as unknown);

// ---------------------------------------------------------------------------
// Sigil parsers
// ---------------------------------------------------------------------------

/**
 * Parse a scam evidence entry `${kind}::${quote}` into its components.
 * Splits on the FIRST `::` — left is kind, right is the liftQuote snippet.
 */
function parseScamEntry(entry: string): { kind: string; quote: string } | null {
  const sepIdx = entry.indexOf('::');
  if (sepIdx < 0) return null;
  return {
    kind: entry.slice(0, sepIdx),
    quote: entry.slice(sepIdx + 2),
  };
}

/**
 * Parse a specificity evidence entry `+:label:quote` or `-:label`.
 * Splits on the FIRST `:` for the sigil, then the NEXT `:` for label/quote.
 */
function parseSpecificityEntry(
  entry: string,
): { sigil: '+' | '-'; label: string; quote: string | undefined } | null {
  const firstColon = entry.indexOf(':');
  if (firstColon < 0) return null;
  const sigil = entry.slice(0, firstColon);
  if (sigil !== '+' && sigil !== '-') return null;

  const rest = entry.slice(firstColon + 1);
  const secondColon = rest.indexOf(':');
  const label = secondColon >= 0 ? rest.slice(0, secondColon) : rest;
  const quote = secondColon >= 0 ? rest.slice(secondColon + 1) : undefined;

  return { sigil, label, quote };
}

/**
 * Map a scam `kind` string to a template function from REASON_TEMPLATES.scam.
 * Returns a plain string (the pre-built reason text).
 */
function scamKindToText(kind: string): string {
  switch (kind) {
    case 'messaging-app':
      return REASON_TEMPLATES.scam.messagingApp();
    case 'external-email':
      return REASON_TEMPLATES.scam.externalEmail();
    case 'urgency':
      return REASON_TEMPLATES.scam.urgency();
    case 'unrealistic-comp':
      return REASON_TEMPLATES.scam.unrealisticComp();
    case 'vague-company':
      return REASON_TEMPLATES.scam.vagueCompany();
    case 'equipment-purchase':
      return REASON_TEMPLATES.scam.equipmentPurchase();
    default:
      return `Suspicious pattern detected`;
  }
}

// ---------------------------------------------------------------------------
// Candidate reason builder (D-39 / D-40)
// ---------------------------------------------------------------------------

function buildCandidateReasons(
  signals: SignalResult[],
  breakdown: SignalBreakdownEntry[],
  _posting: JobPosting,
): Reason[] {
  const candidates: Reason[] = [];

  // Build a Map from SignalKey → breakdown entry for O(1) lookups.
  const breakdownMap = new Map<SignalKey, SignalBreakdownEntry>();
  for (const entry of breakdown) {
    breakdownMap.set(entry.key, entry);
  }

  for (const signal of signals) {
    if (signal.confidence === 0) continue; // degraded signal — no reasons
    const bdEntry = breakdownMap.get(signal.key);
    if (bdEntry === undefined) continue; // not in present signals (should not happen)

    const redSigned = -Math.round(bdEntry.contribution);

    if (signal.key === 'buzzword') {
      // Buzzword: one composite red reason (plan-03-04 discretion fallback).
      // buzzword.ts emits plain liftQuote snippets without category metadata.
      // Strategy: ONE composite reason using 'generic-praise' as the category
      // (the fallback per plan 03-04 action — "label.ts treats the buzzword signal as a
      // single red Reason 'Heavy generic-praise language (N terms)'").
      // evidenceQuote = first snippet so the UI can show an example hit.
      const evidenceEntries = signal.evidence;
      const hitCount = evidenceEntries.length;
      const firstQuote = evidenceEntries.length > 0 ? evidenceEntries[0] : undefined;
      candidates.push({
        text: REASON_TEMPLATES.buzzword.red('generic-praise', hitCount),
        signed: redSigned,
        ...(firstQuote !== undefined ? { evidenceQuote: firstQuote } : {}),
        signalKey: 'buzzword',
      });
    } else if (signal.key === 'specificity') {
      // Specificity: parse +/- sigil entries.
      // Green-flag signed calculation (plan 03-04 formula):
      const presentEntries = signal.evidence.filter((e) => e.startsWith('+:'));
      const presentCount = presentEntries.length;
      let perFieldSigned = MIN_SIGNED_MAGNITUDE;
      if (presentCount > 0) {
        const positiveContribution = (1 - signal.ghostiness) * bdEntry.weight * 100;
        const raw = positiveContribution / presentCount;
        perFieldSigned = Math.round(Math.min(15, Math.max(MIN_SIGNED_MAGNITUDE, raw)));
      }

      for (const entry of signal.evidence) {
        const parsed = parseSpecificityEntry(entry);
        if (parsed === null) continue;

        if (parsed.sigil === '+') {
          // Green-flag: present field with evidence quote (D-42 source).
          candidates.push({
            text: REASON_TEMPLATES.specificity.green(parsed.label),
            signed: perFieldSigned,
            evidenceQuote: parsed.quote,
            signalKey: 'specificity',
          });
        } else {
          // Red: absent field — no evidenceQuote (absence-of-X has no quote, D-40).
          candidates.push({
            text: REASON_TEMPLATES.specificity.red(parsed.label),
            signed: redSigned,
            signalKey: 'specificity',
          });
        }
      }
    } else if (signal.key === 'scam') {
      // Scam: parse `${kind}::${quote}` sigil entries (D-40 scam row).
      for (const entry of signal.evidence) {
        const parsed = parseScamEntry(entry);
        if (parsed === null) continue;
        candidates.push({
          text: scamKindToText(parsed.kind),
          signed: redSigned,
          evidenceQuote: parsed.quote,
          signalKey: 'scam',
        });
      }
    } else if (signal.key === 'ai') {
      // AI text: single red reason, no evidenceQuote (D-40 "Omitted — aggregate assessment").
      candidates.push({
        text: REASON_TEMPLATES.ai.red(),
        signed: redSigned,
        signalKey: 'ai',
      });
    } else if (signal.key === 'llm') {
      // LLM eval: interpolate assessment_summary from evidence[0] (D-40 llm.red template).
      // No evidenceQuote (D-40 "Omitted — aggregate assessment").
      const summary = signal.evidence[0] ?? '';
      // Truncate to 100 chars to keep full reason text within 140 chars.
      const shortPhrase = summary.slice(0, 100);
      candidates.push({
        text: REASON_TEMPLATES.llm.red(shortPhrase),
        signed: redSigned,
        signalKey: 'llm',
      });
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Ranking helpers (D-39 / ENG-08)
// ---------------------------------------------------------------------------

/**
 * Look up a breakdown entry by SignalKey from an array.
 * Uses for..of (Pattern D — no .find on typed arrays without guard).
 */
function findBreakdown(breakdown: SignalBreakdownEntry[], key: SignalKey): SignalBreakdownEntry | undefined {
  for (const entry of breakdown) {
    if (entry.key === key) return entry;
  }
  return undefined;
}

/**
 * Sort candidates by |signed| × confidence × weight descending.
 * Filter out candidates with |signed| < MIN_SIGNED_MAGNITUDE.
 * D-39: ranking key = Math.abs(reason.signed) × breakdown.confidence × breakdown.weight.
 */
function rankCandidates(
  candidates: Reason[],
  breakdown: SignalBreakdownEntry[],
): Reason[] {
  // Compute ranking key for each candidate.
  const scored = candidates
    .filter((r) => Math.abs(r.signed) >= MIN_SIGNED_MAGNITUDE)
    .map((r) => {
      const bd = findBreakdown(breakdown, r.signalKey);
      const rankKey = Math.abs(r.signed) * (bd?.confidence ?? 1) * (bd?.weight ?? 0);
      return { reason: r, rankKey };
    });

  // Sort descending by ranking key.
  scored.sort((a, b) => b.rankKey - a.rankKey);

  return scored.map((s) => s.reason);
}

/**
 * Select top N reasons (3-5). If ranked count < MIN_REASONS, relax the
 * |signed| >= 3 floor by also considering lower-magnitude candidates.
 */
function selectTop(ranked: Reason[], candidates: Reason[], minN: number, maxN: number): Reason[] {
  if (ranked.length >= minN) {
    return ranked.slice(0, maxN);
  }
  // Pad with candidates that didn't pass the floor filter, sorted by |signed| desc.
  const belowFloor = candidates
    .filter((r) => !ranked.includes(r) && Math.abs(r.signed) > 0)
    .sort((a, b) => Math.abs(b.signed) - Math.abs(a.signed));

  return [...ranked, ...belowFloor].slice(0, Math.max(minN, ranked.length));
}

/**
 * D-42: Green-flag prioritization for the legitimate band.
 * Filters candidates to signed > 0 first; pads with least-negative reds if < 3 greens.
 */
function prioritizeGreenFlags(ranked: Reason[]): Reason[] {
  const greens = ranked.filter((r) => r.signed > 0);
  if (greens.length >= MIN_REASONS) {
    return greens.slice(0, MAX_REASONS);
  }
  // Fewer than MIN_REASONS green candidates — pad with least-negative reds.
  const reds = ranked
    .filter((r) => r.signed <= 0)
    .sort((a, b) => b.signed - a.signed); // least negative first

  const combined = [...greens, ...reds];
  return combined.slice(0, Math.max(MIN_REASONS, combined.length));
}

// ---------------------------------------------------------------------------
// Public label function
// ---------------------------------------------------------------------------

/**
 * Map aggregated score and breakdown to a risk band and 3-5 plain-English reasons.
 *
 * @param aggregated - Output of aggregate() containing score and breakdown array.
 * @param signals    - Raw SignalResult[] from all extractors (needed for evidence[]).
 * @param posting    - Original JobPosting (available for future template interpolations).
 * @returns `{ risk, reasons }` where risk is the bandFor(score) key and reasons are
 *   the selected and ranked Reason objects.
 */
export function label(
  aggregated: { score: number; breakdown: SignalBreakdownEntry[] },
  signals: SignalResult[],
  posting: JobPosting,
): { risk: RiskBand; reasons: Reason[] } {
  // D-19 / T-PHASE3-06: bandFor is the ONLY band-lookup. No hardcoded 80/50/20.
  const risk = bandFor(aggregated.score);

  // D-25: LLM-backstop check — Plan 03-03's llmEval sets confidence: 0.5 when
  // is_job_posting === false. Pattern D nuance: .find() is acceptable because
  // the follow-up `if (llmSig !== undefined && ...)` narrows the undefined branch.
  const llmSig = signals.find((s) => s.key === 'llm');
  const isNotPostingPerLlm =
    llmSig !== undefined && llmSig.confidence > 0 && llmSig.confidence < 1;

  // Build candidate reasons from all signals (D-39 / D-40 templating).
  const candidates = buildCandidateReasons(signals, aggregated.breakdown, posting);

  // Rank candidates by |signed| × confidence × weight (D-39 / ENG-08).
  const ranked = rankCandidates(candidates, aggregated.breakdown);

  // D-42: green-flag prioritization fires when bandFor returns 'legitimate'.
  // This routes the threshold through bandFor (the single source of truth — D-19)
  // and avoids the literal 80 appearing in this file (T-PHASE3-06 compliance).
  const selected =
    risk === 'legitimate'
      ? prioritizeGreenFlags(ranked)
      : selectTop(ranked, candidates, MIN_REASONS, MAX_REASONS);

  // D-25: dominant-negative reason wins reasons[0] when LLM backstop trips.
  const reasons: Reason[] = isNotPostingPerLlm
    ? [DOMINANT_NEGATIVE_REASON, ...selected.slice(0, MAX_REASONS - 1)]
    : selected;

  return { risk, reasons };
}
