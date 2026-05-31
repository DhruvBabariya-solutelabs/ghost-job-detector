/**
 * Indeed job-board adapter — JSON-LD primary + CSS-selector fallback chain.
 *
 * Source: schema.org JobPosting spec + RESEARCH.md Pattern 2 indeed snippet (lines 488-498).
 *
 * Invariants (MUST NOT be violated — PITFALLS "Indeed Show More" + RESEARCH Anti-Patterns):
 *   - DO NOT click "Show more" or any other interactive element
 *   - The full description text is in the DOM under #jobDescriptionText regardless
 *     of visible-vs-clipped state — programmatic clicks cross the user-intent ethical line
 *   - DO NOT mutate the DOM
 *   - DO NOT auto-navigate
 *   - Use querySelector/querySelectorAll only (no live HTMLCollections)
 *
 * Note on duplication: readJsonLd / readText / stripHtml are intentionally duplicated
 * from linkedin.ts. Per CLAUDE.md "duplicated v1" convention, refactoring into a shared
 * helper module is v2 work (CONTEXT.md <deferred>).
 */
import type { JobBoardAdapter } from './types.js';
import type { JobPosting } from '@ghost/shared';

// RESEARCH.md lines 491-496 (verbatim). #jobDescriptionText is the stable Indeed selector
// verified against regional variants (uk.indeed.com, ca.indeed.com, de.indeed.com — RESEARCH A3).
// Updated 2026-05 (Phase 7 hardened): added bare data-testid title fallback without span
// combinator in case Indeed changes the inner span nesting in the job info header.
const CSS_FALLBACK_INDEED = {
  title:
    '[data-testid="jobsearch-JobInfoHeader-title"] span, [data-testid="jobsearch-JobInfoHeader-title"], .jobsearch-JobInfoHeader-title, h1.jobsearch-JobInfoHeader-title-container',
  company:
    '[data-testid="inlineHeader-companyName"] a, [data-company-name="true"], .jobsearch-CompanyInfoContainer a',
  location:
    '[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle div:nth-of-type(2)',
  description: '#jobDescriptionText', // STABLE — primary Indeed selector
} as const;

/**
 * Walk all `<script type="application/ld+json">` blocks and return the first
 * one that has `@type === 'JobPosting'`. Handles both the single-object form
 * and the `@graph` array form. Malformed JSON blocks are silently skipped
 * (T-04-14 mitigation — one bad block does not poison subsequent ones).
 */
function readJsonLd(doc: Document): Partial<JobPosting> | null {
  const blocks = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const block of Array.from(blocks)) {
    try {
      const raw = JSON.parse(block.textContent ?? '') as unknown;
      if (typeof raw !== 'object' || raw === null) continue;
      // schema.org allows either a single object or a @graph array
      const graph = (raw as Record<string, unknown>)['@graph'];
      const candidates: unknown[] = Array.isArray(raw)
        ? raw
        : Array.isArray(graph)
          ? graph
          : [raw];
      for (const c of candidates) {
        if (typeof c !== 'object' || c === null) continue;
        const candidate = c as Record<string, unknown>;
        if (candidate['@type'] === 'JobPosting') {
          const hiringOrg = candidate['hiringOrganization'] as Record<string, unknown> | undefined;
          const jobLocation = candidate['jobLocation'] as Record<string, unknown> | undefined;
          const address = jobLocation?.['address'] as Record<string, unknown> | undefined;
          return {
            title: typeof candidate['title'] === 'string' ? candidate['title'] : '',
            company: typeof hiringOrg?.['name'] === 'string' ? hiringOrg['name'] : '',
            location:
              typeof address?.['addressLocality'] === 'string'
                ? address['addressLocality']
                : typeof address?.['addressRegion'] === 'string'
                  ? address['addressRegion']
                  : '',
            // description is HTML in schema.org (RESEARCH A10) — strip via temp div
            description: stripHtml(
              typeof candidate['description'] === 'string' ? candidate['description'] : '',
            ),
          };
        }
      }
    } catch {
      // malformed JSON-LD block — try the next one (T-04-14)
    }
  }
  return null;
}

/**
 * Split a comma-separated selector chain, try each left-to-right, return the
 * first non-empty textContent.trim(). Returns '' if no selector matches.
 */
function readText(doc: Document, fallbackSelector: string): string {
  for (const sel of fallbackSelector.split(',').map((s) => s.trim())) {
    const el = doc.querySelector(sel);
    const txt = el?.textContent?.trim() ?? '';
    if (txt.length > 0) return txt;
  }
  return '';
}

/**
 * Strip HTML tags from a string using a detached div (no rendering, no script
 * execution since detached `<script>` doesn't execute, no resource loading
 * because the div is never attached to document). T-04-15 mitigation.
 */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent?.trim() ?? '';
}

export const indeedAdapter: JobBoardAdapter = {
  id: 'indeed',
  matches: (url) =>
    // endsWith (NOT ===) so regional subdomains work: uk.indeed.com, ca.indeed.com, de.indeed.com
    // No pathname filter beyond hostname — Indeed has many job-detail URL shapes
    // (/viewjob, /jobs?vjk=, etc.) and the manifest's content_scripts.matches already narrows
    url.hostname.endsWith('indeed.com'),
  extract(doc) {
    // Primary: JSON-LD (Indeed also serves JSON-LD JobPosting — RESEARCH A1/A2/A3)
    const jsonLd = readJsonLd(doc);
    if (jsonLd?.title && jsonLd.description && jsonLd.description.length >= 20) {
      return {
        title: jsonLd.title,
        company: jsonLd.company ?? '',
        location: jsonLd.location ?? '',
        description: jsonLd.description,
        sourceUrl: doc.location?.href,
      };
    }
    // Fallback: CSS selector chains
    // #jobDescriptionText — read textContent regardless of "Show more" visible-vs-clipped state.
    // Full text is in the DOM already; we do NOT programmatically click "Show more" (PITFALLS).
    const title = readText(doc, CSS_FALLBACK_INDEED.title);
    const description = readText(doc, CSS_FALLBACK_INDEED.description);
    // description.length < 20 matches JobPostingSchema.description.min(20) — empty-state trigger
    if (!title || description.length < 20) return null;
    return {
      title,
      company: readText(doc, CSS_FALLBACK_INDEED.company),
      location: readText(doc, CSS_FALLBACK_INDEED.location),
      description,
      sourceUrl: doc.location?.href,
    };
  },
};
