import type {
  BuzzwordCategory,
  JobPosting,
  Reason,
  RiskBand,
  SignalBreakdownEntry,
  SignalKey,
  SignalResult,
} from '@ghost/shared';
import { bandFor } from '@ghost/shared';

const MIN_SIGNED_MAGNITUDE = 3;
const MIN_REASONS = 3;
const MAX_REASONS = 5;

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

export const DOMINANT_NEGATIVE_REASON: Reason = {
  text: "This doesn't look like a job posting - score may not be meaningful",
  signed: 0,
  signalKey: 'llm',
};

function capitalizeFirst(s: string): string {
  if (s.length === 0) return s;
  const first = s[0];
  return first !== undefined ? first.toUpperCase() + s.slice(1) : s;
}

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

function parseScamEntry(entry: string): { kind: string; quote: string } | null {
  const sepIdx = entry.indexOf('::');
  if (sepIdx < 0) return null;
  return {
    kind: entry.slice(0, sepIdx),
    quote: entry.slice(sepIdx + 2),
  };
}

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

function buildCandidateReasons(
  signals: SignalResult[],
  breakdown: SignalBreakdownEntry[],
  _posting: JobPosting,
): Reason[] {
  const candidates: Reason[] = [];

  const breakdownMap = new Map<SignalKey, SignalBreakdownEntry>();
  for (const entry of breakdown) {
    breakdownMap.set(entry.key, entry);
  }

  for (const signal of signals) {
    if (signal.confidence === 0) continue;
    const bdEntry = breakdownMap.get(signal.key);
    if (bdEntry === undefined) continue;

    const redSigned = -Math.round(bdEntry.contribution);

    if (signal.key === 'buzzword') {
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
          candidates.push({
            text: REASON_TEMPLATES.specificity.green(parsed.label),
            signed: perFieldSigned,
            evidenceQuote: parsed.quote,
            signalKey: 'specificity',
          });
        } else {
          candidates.push({
            text: REASON_TEMPLATES.specificity.red(parsed.label),
            signed: redSigned,
            signalKey: 'specificity',
          });
        }
      }
    } else if (signal.key === 'scam') {
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
      candidates.push({
        text: REASON_TEMPLATES.ai.red(),
        signed: redSigned,
        signalKey: 'ai',
      });
    } else if (signal.key === 'llm') {
      const summary = signal.evidence[0] ?? '';
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

function findBreakdown(
  breakdown: SignalBreakdownEntry[],
  key: SignalKey,
): SignalBreakdownEntry | undefined {
  for (const entry of breakdown) {
    if (entry.key === key) return entry;
  }
  return undefined;
}

function rankCandidates(candidates: Reason[], breakdown: SignalBreakdownEntry[]): Reason[] {
  const scored = candidates
    .filter((r) => Math.abs(r.signed) >= MIN_SIGNED_MAGNITUDE)
    .map((r) => {
      const bd = findBreakdown(breakdown, r.signalKey);
      const rankKey = Math.abs(r.signed) * (bd?.confidence ?? 1) * (bd?.weight ?? 0);
      return { reason: r, rankKey };
    });

  scored.sort((a, b) => b.rankKey - a.rankKey);

  return scored.map((s) => s.reason);
}

function selectTop(ranked: Reason[], candidates: Reason[], minN: number, maxN: number): Reason[] {
  if (ranked.length >= minN) {
    return ranked.slice(0, maxN);
  }
  const belowFloor = candidates
    .filter((r) => !ranked.includes(r) && Math.abs(r.signed) > 0)
    .sort((a, b) => Math.abs(b.signed) - Math.abs(a.signed));

  return [...ranked, ...belowFloor].slice(0, Math.max(minN, ranked.length));
}

function prioritizeGreenFlags(ranked: Reason[]): Reason[] {
  const greens = ranked.filter((r) => r.signed > 0);
  if (greens.length >= MIN_REASONS) {
    return greens.slice(0, MAX_REASONS);
  }
  const reds = ranked.filter((r) => r.signed <= 0).sort((a, b) => b.signed - a.signed);

  const combined = [...greens, ...reds];
  return combined.slice(0, Math.max(MIN_REASONS, combined.length));
}

export function label(
  aggregated: { score: number; breakdown: SignalBreakdownEntry[] },
  signals: SignalResult[],
  posting: JobPosting,
): { risk: RiskBand; reasons: Reason[] } {
  const risk = bandFor(aggregated.score);

  const llmSig = signals.find((s) => s.key === 'llm');
  const isNotPostingPerLlm = llmSig !== undefined && llmSig.confidence > 0 && llmSig.confidence < 1;

  const candidates = buildCandidateReasons(signals, aggregated.breakdown, posting);

  const ranked = rankCandidates(candidates, aggregated.breakdown);

  const selected =
    risk === 'legitimate'
      ? prioritizeGreenFlags(ranked)
      : selectTop(ranked, candidates, MIN_REASONS, MAX_REASONS);

  const reasons: Reason[] = isNotPostingPerLlm
    ? [DOMINANT_NEGATIVE_REASON, ...selected.slice(0, MAX_REASONS - 1)]
    : selected;

  return { risk, reasons };
}
