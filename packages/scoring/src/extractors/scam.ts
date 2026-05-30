/**
 * Scam-signal heuristic extractor (ENG-03).
 *
 * Applies a SCAM_PATTERNS table against the job description and returns a binary
 * confidence result (D-33). This extractor has the highest stakes in the engine:
 * a scam false-negative (missing a real scam signal) is strictly worse than a
 * caution false-positive — a user trusting "Caution" on a posting with WhatsApp
 * contact + $5,000/week + "urgent" can lose money (AI-SPEC §1 Critical Failure
 * Mode #2).
 *
 * Locked decisions:
 * - D-33: Binary confidence — `1.0` on ≥1 hit, `0` on no hits. When no patterns
 *   fire, the signal drops silently out of Plan 03-04's weight renormalization
 *   (aggregator filters `confidence === 0`). This prevents "scam absent" from
 *   contributing zero-ghostiness noise to the score.
 * - D-40: Scam-row templates keyed by `kind` — the labeler in Plan 03-04
 *   maps `kind` → user-facing template string. This extractor does NOT
 *   pre-interpolate platform names into the evidence; it emits raw sigils.
 * - No green-flag direction (CONTEXT D-42 line 187): scam either fires (red)
 *   or is absent (drops out). There is no "no scam detected" positive reason.
 *
 * Evidence sigil format (LOCKED — WARNING 5 fix, parsed by Plan 03-04 label.ts):
 *   `${kind}::${liftQuote(description, matchIndex)}`
 * The separator is a literal double-colon `::`. label.ts splits on the FIRST `::`
 * to recover `kind` (left) and `quote` (right) deterministically.
 * Example evidence entries:
 *   'messaging-app::...contact via WhatsApp at +1-555-1234...'
 *   'urgency::...urgent hiring! start tomorrow...'
 *   'unrealistic-comp::...$5,000/week guaranteed...'
 *
 * Pattern sources (per AI-SPEC §1b domain context):
 *   messaging-app: FBI IC3 PSA 2022-02-01 — top employment-scam vector
 *   external-email: FTC Consumer Alert Sept 2025 — company email = legitimacy signal
 *   urgency: FTC Job Scams Page — artificial urgency is a manipulation tactic
 *   unrealistic-comp: FBI 2025 — cryptocurrency job-scam "$500/day" shapes
 *   vague-company: FBI IC3 — impersonation / vague-business-front pattern
 *   equipment-purchase: FBI IC3 — upfront payment / equipment fee requests
 */

import type { JobPosting, SignalResult } from '@ghost/shared';
import { liftQuote } from './lift-quote.js';

// ---------------------------------------------------------------------------
// Scam-pattern table (Pattern C `as const`)
// ---------------------------------------------------------------------------

/**
 * Each entry describes one scam-signal pattern.
 * `kind` values are the LOCKED set that Plan 03-04's label.ts maps to templates.
 * `severity` is the ghostiness contribution (0..1) when this pattern fires.
 * Ghostiness = max(severity) across all hits (highest-severity pattern dominates).
 */
const SCAM_PATTERNS = [
  {
    kind: 'messaging-app',
    label: 'Asks for contact via {platform}',
    regex: /\b(whatsapp|telegram|signal|wire)\b/i,
    severity: 0.95,
    // FBI IC3 PSA 2022-02-01: messaging-app contact is the #1 employment scam vector
  },
  {
    kind: 'external-email',
    label: 'External email contact',
    regex: /\b[\w.-]+@(gmail|yahoo|hotmail|outlook|protonmail|mail)\.com\b/i,
    severity: 0.85,
    // FTC Consumer Alert Sept 2025: legitimate employers use company-domain email
  },
  {
    kind: 'urgency',
    label: 'Urgent hiring pressure',
    regex: /\b(urgent|asap|immediately|today only|start tomorrow|hire asap|must start|available immediately)\b/i,
    severity: 0.5,
    // FTC Job Scams Page: artificial urgency is a manipulation tactic
  },
  {
    kind: 'unrealistic-comp',
    label: 'Unrealistic compensation claim',
    regex: /\$?\d{3,4}(\.\d+)?\/(week|month|day|hour)\b/i,
    severity: 0.9,
    // FBI 2025: cryptocurrency job-scam "$500/day" shapes; $3,000/week etc.
  },
  {
    kind: 'vague-company',
    label: 'Vague company description',
    regex: /\b(established (firm|company)|leading provider|industry leader|reputable (company|firm))\b/i,
    severity: 0.4,
    // FBI IC3: impersonation / vague-business-front pattern ("established firm")
  },
  {
    kind: 'equipment-purchase',
    label: 'Upfront equipment or fee request',
    regex: /\b(buy equipment|purchase equipment|equipment fee|training fee|send (a\s*)?check|wire (us|funds)|refundable (deposit|fee))\b/i,
    severity: 0.95,
    // FBI IC3: upfront-payment / equipment-purchase is a defining scam characteristic
    // AI-SPEC §1b "Upfront-payment / equipment-purchase request" row
  },
] as const;

// ---------------------------------------------------------------------------
// Maximum evidence entries to emit per call
// ---------------------------------------------------------------------------
const MAX_SCAM_EVIDENCE = 5;

// ---------------------------------------------------------------------------
// Extractor
// ---------------------------------------------------------------------------

/**
 * Extract scam-signal from a job posting.
 *
 * @returns SignalResult with:
 *   - `key: 'scam'`
 *   - `ghostiness`: max(severity) across hits (0 when no hits)
 *   - `confidence`: 1.0 on ≥1 hit; 0 on no hits (D-33 binary)
 *   - `evidence`: `${kind}::${liftQuote}` entries sorted by severity desc (top 5 max)
 */
export function extractScam(posting: JobPosting): SignalResult {
  const description = posting.description;

  // Collect all hits across all patterns (Pattern D — for..of, no .find, no [i]).
  const hits: Array<{ kind: string; severity: number; matchIndex: number }> = [];

  for (const pattern of SCAM_PATTERNS) {
    // matchAll requires the regex to have the global flag; we create a fresh
    // instance with `g` added so we don't mutate the as-const pattern.
    const globalRegex = new RegExp(pattern.regex.source, `${pattern.regex.flags}g`);
    for (const match of description.matchAll(globalRegex)) {
      hits.push({
        kind: pattern.kind,
        severity: pattern.severity,
        matchIndex: match.index ?? 0,
      });
    }
  }

  // D-33 binary off-state: no hits → confidence 0 → signal drops from aggregator.
  if (hits.length === 0) {
    return { key: 'scam', ghostiness: 0, confidence: 0, evidence: [] };
  }

  // Sort by severity descending so highest-risk evidence surfaces first.
  hits.sort((a, b) => b.severity - a.severity);

  // Ghostiness = max severity across all hits (first entry after sort).
  let maxSeverity = 0;
  for (const hit of hits) {
    if (hit.severity > maxSeverity) maxSeverity = hit.severity;
  }

  // Build evidence entries using the LOCKED sigil format (WARNING 5):
  // `${kind}::${liftQuote(description, matchIndex)}`
  // label.ts (Plan 03-04) splits on the FIRST '::' to parse kind and quote.
  const evidence: string[] = [];
  for (const hit of hits) {
    if (evidence.length >= MAX_SCAM_EVIDENCE) break;
    evidence.push(`${hit.kind}::${liftQuote(description, hit.matchIndex)}`);
  }

  return { key: 'scam', ghostiness: maxSeverity, confidence: 1.0, evidence };
}
