import type { JobPosting } from '@ghost/shared';
import type { JobBoardAdapter } from './types.js';

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

export const linkedinAdapter: JobBoardAdapter = {
  id: 'linkedin',
  matches: (url) => url.hostname.endsWith('linkedin.com') && url.pathname.includes('/jobs/'),
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
    const title = readText(doc, CSS_FALLBACK.title);
    const description = readText(doc, CSS_FALLBACK.description);
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
