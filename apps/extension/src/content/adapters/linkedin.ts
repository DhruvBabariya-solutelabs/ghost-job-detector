/**
 * LinkedIn job-board adapter — JSON-LD primary + CSS-selector fallback chain.
 *
 * Source: schema.org JobPosting spec + dev.to alterlab guide (2026) [VERIFIED]
 * RESEARCH.md Pattern 2 (lines 395-485) is the canonical implementation reference.
 *
 * Invariants (MUST NOT be violated — PITFALLS "LinkedIn Anti-Automation"):
 *   - DO NOT mutate the DOM
 *   - DO NOT click any element
 *   - DO NOT auto-navigate
 *   - DO NOT prefetch other postings
 *   - Use querySelector/querySelectorAll only (no live HTMLCollections)
 */
import type { JobBoardAdapter } from './types.js';
import type { JobPosting } from '@ghost/shared';

// Updated 2026-05 (Phase 7 hardened) from dev.to alterlab guide. Each value is a
// comma-separated fallback chain — try left-to-right, first non-empty wins.
// Phase 7 additions: broad attribute-contains selectors appended so class-name
// churn on future LinkedIn deploys degrades gracefully instead of silently failing.
// 2026-05 (quick 260525-uy9): logged-in `/jobs/view/` emits zero JSON-LD; `#job-details`
// is the live description anchor — prepended first, older selectors retained as fallbacks.
const CSS_FALLBACK = {
  title:
    'h1[class*="job-title"], .job-details-jobs-unified-top-card__job-title h1, .job-details-jobs-unified-top-card__job-title, .top-card-layout__title, .topcard__title, h1.t-24',
  company:
    '.job-details-jobs-unified-top-card__company-name a, [class*="job-details-jobs-unified-top-card__company-name"], .artdeco-entity-lockup__title, .topcard__org-name-link, .top-card-layout__second-subline a',
  location:
    '.job-details-jobs-unified-top-card__primary-description-container .tvm__text:first-child, [class*="primary-description"] .tvm__text, .topcard__flavor--bullet, .top-card-layout__second-subline span',
  description:
    '#job-details, article.jobs-description__container, .jobs-description__content .jobs-description-content__text, [class*="jobs-description"] [class*="description-content__text"], .jobs-description-content__text--collapsed, .show-more-less-html__markup, .description__text, .jobs-box__html-content',
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

export const linkedinAdapter: JobBoardAdapter = {
  id: 'linkedin',
  matches: (url) =>
    // endsWith (NOT ===) so regional subdomains work: uk.linkedin.com, de.linkedin.com, etc.
    // pathname includes /jobs/ — covers /jobs/view/, /jobs/search/, /jobs/collections/
    url.hostname.endsWith('linkedin.com') && url.pathname.includes('/jobs/'),
  extract(doc) {
    // Primary: JSON-LD (stable across LinkedIn class-name churn — RESEARCH §"State of the Art")
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
    // Fallback: CSS selector chains (activated only when JSON-LD is absent or insufficient)
    const title = readText(doc, CSS_FALLBACK.title);
    const description = readText(doc, CSS_FALLBACK.description);
    // description.length < 20 matches JobPostingSchema.description.min(20) — empty-state trigger
    if (!title || description.length < 20) return null;
    return {
      title,
      company: readText(doc, CSS_FALLBACK.company),
      location: readText(doc, CSS_FALLBACK.location),
      description,
      sourceUrl: doc.location?.href,
    };
  },
};
