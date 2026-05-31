import type { JobPosting, SignalResult } from '@ghost/shared';
import { liftQuote } from './lift-quote.js';

const SCAM_PATTERNS = [
  {
    kind: 'messaging-app',
    label: 'Asks for contact via {platform}',
    regex: /\b(whatsapp|telegram|signal|wire)\b/i,
    severity: 0.95,
  },
  {
    kind: 'external-email',
    label: 'External email contact',
    regex: /\b[\w.-]+@(gmail|yahoo|hotmail|outlook|protonmail|mail)\.com\b/i,
    severity: 0.85,
  },
  {
    kind: 'urgency',
    label: 'Urgent hiring pressure',
    regex:
      /\b(urgent|asap|immediately|today only|start tomorrow|hire asap|must start|available immediately)\b/i,
    severity: 0.5,
  },
  {
    kind: 'unrealistic-comp',
    label: 'Unrealistic compensation claim',
    regex: /\$?\d{3,4}(\.\d+)?\/(week|month|day|hour)\b/i,
    severity: 0.9,
  },
  {
    kind: 'vague-company',
    label: 'Vague company description',
    regex:
      /\b(established (firm|company)|leading provider|industry leader|reputable (company|firm))\b/i,
    severity: 0.4,
  },
  {
    kind: 'equipment-purchase',
    label: 'Upfront equipment or fee request',
    regex:
      /\b(buy equipment|purchase equipment|equipment fee|training fee|send (a\s*)?check|wire (us|funds)|refundable (deposit|fee))\b/i,
    severity: 0.95,
  },
] as const;

const MAX_SCAM_EVIDENCE = 5;

export function extractScam(posting: JobPosting): SignalResult {
  const description = posting.description;

  const hits: Array<{ kind: string; severity: number; matchIndex: number }> = [];

  for (const pattern of SCAM_PATTERNS) {
    const globalRegex = new RegExp(pattern.regex.source, `${pattern.regex.flags}g`);
    for (const match of description.matchAll(globalRegex)) {
      hits.push({
        kind: pattern.kind,
        severity: pattern.severity,
        matchIndex: match.index ?? 0,
      });
    }
  }

  if (hits.length === 0) {
    return { key: 'scam', ghostiness: 0, confidence: 0, evidence: [] };
  }

  hits.sort((a, b) => b.severity - a.severity);

  let maxSeverity = 0;
  for (const hit of hits) {
    if (hit.severity > maxSeverity) maxSeverity = hit.severity;
  }

  const evidence: string[] = [];
  for (const hit of hits) {
    if (evidence.length >= MAX_SCAM_EVIDENCE) break;
    evidence.push(`${hit.kind}::${liftQuote(description, hit.matchIndex)}`);
  }

  return { key: 'scam', ghostiness: maxSeverity, confidence: 1.0, evidence };
}
