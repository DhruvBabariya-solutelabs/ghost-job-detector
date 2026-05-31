/**
 * Job-board adapter contract — the load-bearing seam between content script
 * and engine wire shape (CLAUDE.md "three load-bearing seams").
 *
 * `extract(doc)` returns a JobPosting validating against JobPostingSchema, or
 * `null` if the adapter cannot read this page. ARCHITECTURE.md §4.2: PURE
 * function — no I/O, no DOM mutation, no clicks, no auto-navigation.
 *
 * `id` is a closed literal union (not `string`) — enables exhaustiveness
 * checks in the pickAdapter registry. Adding a new board (Glassdoor in v2)
 * extends this union AND adds a registry entry.
 *
 * `matches(url)` is given the parsed URL (not href) so the adapter can
 * `url.hostname.endsWith('linkedin.com')` against regional subdomains.
 */
import type { JobPosting } from '@ghost/shared';

export interface JobBoardAdapter {
  id: 'linkedin' | 'indeed';
  matches: (url: URL) => boolean;
  extract: (doc: Document) => JobPosting | null;
}
