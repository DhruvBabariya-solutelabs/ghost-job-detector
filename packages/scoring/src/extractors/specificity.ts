import type { JobPosting, SignalResult } from '@ghost/shared';
import { liftQuote } from './lift-quote.js';

const SPECIFICITY_FIELDS = [
  {
    key: 'salary',
    label: 'salary range',
    regex:
      /(?:\$\d[\d,]*(?:\.\d+)?[kK]?(?:\s*[-–]\s*\$?\d[\d,]*(?:\.\d+)?[kK]?)?|\d[\d,]+(?:\.\d+)?\s*[kK](?:\s*[-–]\s*\d[\d,]*[kK]?)?|\bUSD\s*\d[\d,]+)/i,
  },
  {
    key: 'stack',
    label: 'tech stack',
    regex:
      /\b(typescript|javascript|python|java|golang|go\b|rust|ruby|php|swift|kotlin|scala|c\+\+|c#|react|vue|angular|svelte|node\.?js|express|fastapi|django|rails|spring|postgres|mysql|mongodb|redis|kafka|aws|gcp|azure|docker|kubernetes|terraform|graphql|rest api|sql|nosql|linux)\b/i,
  },
  {
    key: 'yoe',
    label: 'years of experience',
    regex: /\b\d+\+?\s*([-–]\s*\d+\s*)?(year|yr)s?\b/i,
  },
  {
    key: 'location',
    label: 'office location',
    regex:
      /\b(remote|hybrid|on-?site|onsite|in-?office|san francisco|new york|seattle|austin|boston|chicago|los angeles|denver|atlanta|miami|dallas|portland|toronto|london|berlin|amsterdam|singapore)\b/i,
  },
  {
    key: 'benefits',
    label: 'benefits',
    regex:
      /\b(401k|401\(k\)|pto|paid time off|health\s*(insurance|care|plan|benefits?)|dental|vision|equity|stock\s*options?|vesting|parental\s*leave|sick\s*leave|vacation|life\s*insurance)\b/i,
  },
  {
    key: 'reporting',
    label: 'reporting structure',
    regex:
      /\b(reports?\s*to|reporting\s*to|direct\s*report|manage[ds]?\s*(a\s*team|directly)|vp\s*(of|engineering|product)|head\s*of|director\s*(of|,)|chief\s*(technology|product|executive)\s*officer|cto\b|cpo\b|ceo\b)\b/i,
  },
  {
    key: 'team',
    label: 'team',
    regex:
      /\b(team\s*(of\s*\d+)?|squad|pod|crew|group|department|division|cross-?functional\s*team|engineering\s*team|product\s*team)\b/i,
  },
  {
    key: 'timeline',
    label: 'timeline',
    regex:
      /\b(start\s*(date|in|by|of)|begin\s*(in|on|by)|onboard(ing)?|join\s*(by|in|us\s*in)|target\s*(start|date)|q[1-4]\s*(20\d{2})|january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  },
] as const;

function specGhostinessForMissing(missing: number): number {
  return missing <= 2
    ? 0.0 + missing * 0.1
    : missing <= 5
      ? 0.3 + (missing - 2) * 0.15
      : 0.75 + (missing - 5) * 0.05;
}

export function extractSpecificity(posting: JobPosting): SignalResult {
  const description = posting.description;
  const evidence: string[] = [];
  let missing = 0;

  for (const field of SPECIFICITY_FIELDS) {
    const match = field.regex.exec(description);
    if (match !== null) {
      const quote = liftQuote(description, match.index);
      evidence.push(`+:${field.label}:${quote}`);
    } else {
      evidence.push(`-:${field.label}`);
      missing += 1;
    }
  }

  const ghostiness = specGhostinessForMissing(missing);

  return { key: 'specificity', ghostiness, confidence: 1.0, evidence };
}
