import type { JobPosting } from '@ghost/shared';

export interface JobBoardAdapter {
  id: 'linkedin' | 'indeed';
  matches: (url: URL) => boolean;
  extract: (doc: Document) => JobPosting | null;
}
