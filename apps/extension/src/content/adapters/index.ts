import { indeedAdapter } from './indeed.js';
import { linkedinAdapter } from './linkedin.js';
import type { JobBoardAdapter } from './types.js';

const ADAPTERS: readonly JobBoardAdapter[] = [linkedinAdapter, indeedAdapter];

export function pickAdapter(href: string): JobBoardAdapter | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  for (const a of ADAPTERS) {
    if (a.matches(url)) return a;
  }
  return null;
}

export type { JobBoardAdapter } from './types.js';
