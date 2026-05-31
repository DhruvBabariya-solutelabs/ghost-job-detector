import type { BuzzwordCategory, JobPosting, SignalResult } from '@ghost/shared';
import { BUZZWORDS } from '@ghost/shared';
import { liftQuote } from './lift-quote.js';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const BUZZWORD_REGEX: Record<BuzzwordCategory, RegExp> = Object.fromEntries(
  (Object.entries(BUZZWORDS) as [BuzzwordCategory, readonly string[]][]).map(([cat, terms]) => [
    cat,
    new RegExp(`\\b(${terms.map(escapeRegex).join('|')})\\b`, 'gi'),
  ]),
) as Record<BuzzwordCategory, RegExp>;

const MAX_BUZZ_GHOSTINESS = 0.9;

const SCALE = Math.log2(8);

function buzzGhostinessForCount(count: number): number {
  return Math.min(MAX_BUZZ_GHOSTINESS, Math.log2(count + 1) / SCALE);
}

const MAX_EVIDENCE = 5;

export function extractBuzzword(posting: JobPosting): SignalResult {
  const description = posting.description;
  const evidence: string[] = [];
  let totalCount = 0;

  for (const [, regex] of Object.entries(BUZZWORD_REGEX)) {
    regex.lastIndex = 0;
    for (const match of description.matchAll(regex)) {
      totalCount += 1;
      if (evidence.length < MAX_EVIDENCE) {
        evidence.push(liftQuote(description, match.index ?? 0));
      }
    }
  }

  const ghostiness = buzzGhostinessForCount(totalCount);
  const confidence = totalCount > 0 ? 1.0 : 0.5;

  return { key: 'buzzword', ghostiness, confidence, evidence };
}
