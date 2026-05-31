/**
 * Adapter registry — `pickAdapter(href)` returns the first adapter whose
 * `matches(url)` returns true, or null if no adapter handles this URL.
 *
 * Adding a board: write a new adapter file (e.g. glassdoor.ts), import it
 * here, add to ADAPTERS in URL-specificity order (most-specific first), and
 * extend the JobBoardAdapter['id'] union in types.ts.
 */
import type { JobBoardAdapter } from './types.js';
import { linkedinAdapter } from './linkedin.js';
import { indeedAdapter } from './indeed.js';

const ADAPTERS: readonly JobBoardAdapter[] = [linkedinAdapter, indeedAdapter];

export function pickAdapter(href: string): JobBoardAdapter | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null; // malformed href — bail
  }
  for (const a of ADAPTERS) {
    if (a.matches(url)) return a;
  }
  return null;
}

export type { JobBoardAdapter } from './types.js';
