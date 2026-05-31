import type { JobPosting } from '@ghost/shared';

function truncate6000(d: string): string {
  const CAP = 6_000;
  const HEAD = 3_600;
  const TAIL = 1_400;
  if (d.length <= CAP) return d;
  return d.slice(0, HEAD) + '\n... [posting truncated mid-content] ...\n' + d.slice(-TAIL);
}

function stripControlChars(s: string): string {
  return s
    .replace(/​|‌|‍|﻿/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {3,}/g, ' ');
}

export function buildUserInput(posting: JobPosting): string {
  const sanitized = stripControlChars(truncate6000(posting.description));
  return (
    'Analyze the following job posting:\n' +
    '<JOB_POSTING>\n' +
    sanitized +
    '\n</JOB_POSTING>\n' +
    'Title: ' +
    posting.title +
    '\n' +
    'Company: ' +
    posting.company +
    '\n' +
    'Location: ' +
    posting.location
  );
}
