import type { JobPosting } from '@ghost/shared';
import type { JobBoardAdapter } from './types.js';

const CSS_FALLBACK_INDEED = {
  title:
    '[data-testid="jobsearch-JobInfoHeader-title"] span, [data-testid="jobsearch-JobInfoHeader-title"], .jobsearch-JobInfoHeader-title, h1.jobsearch-JobInfoHeader-title-container',
  company:
    '[data-testid="inlineHeader-companyName"] a, [data-company-name="true"], .jobsearch-CompanyInfoContainer a',
  location: '[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle div:nth-of-type(2)',
  description: '#jobDescriptionText',
} as const;

function readJsonLd(doc: Document): Partial<JobPosting> | null {
  const blocks = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const block of Array.from(blocks)) {
    try {
      const raw = JSON.parse(block.textContent ?? '') as unknown;
      if (typeof raw !== 'object' || raw === null) continue;
      const graph = (raw as Record<string, unknown>)['@graph'];
      const candidates: unknown[] = Array.isArray(raw) ? raw : Array.isArray(graph) ? graph : [raw];
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
            description: stripHtml(
              typeof candidate['description'] === 'string' ? candidate['description'] : '',
            ),
          };
        }
      }
    } catch {}
  }
  return null;
}

function readText(doc: Document, fallbackSelector: string): string {
  for (const sel of fallbackSelector.split(',').map((s) => s.trim())) {
    const el = doc.querySelector(sel);
    const txt = el?.textContent?.trim() ?? '';
    if (txt.length > 0) return txt;
  }
  return '';
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent?.trim() ?? '';
}

export const indeedAdapter: JobBoardAdapter = {
  id: 'indeed',
  matches: (url) => url.hostname.endsWith('indeed.com'),
  extract(doc) {
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
    const title = readText(doc, CSS_FALLBACK_INDEED.title);
    const description = readText(doc, CSS_FALLBACK_INDEED.description);
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
