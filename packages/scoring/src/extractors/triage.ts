import type { JobPosting } from '@ghost/shared';

const JOB_TERMS =
  /\b(role|engineer|manager|developer|designer|analyst|responsibilities|requirements|qualifications|apply|position|hiring)\b/i;

export function isLikelyJobPosting(p: JobPosting): boolean {
  const d = p.description;
  return d.length >= 200 && d.length <= 50_000 && JOB_TERMS.test(d);
}
