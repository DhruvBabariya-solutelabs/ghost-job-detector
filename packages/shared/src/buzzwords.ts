export const BUZZWORDS = {
  generic: ['rockstar', 'ninja', 'wizard', 'guru', 'unicorn', 'all-star'],
  urgency: ['fast-paced', 'asap', 'urgent', 'high-velocity', 'high-pressure'],
  vague: [
    'wear many hats',
    'self-starter',
    'dynamic culture',
    'team player',
    'thrive in ambiguity',
  ],
  inflation: ['competitive comp', 'top-tier', 'best-in-class', 'world-class', 'industry-leading'],
} as const;

export type BuzzwordCategory = keyof typeof BUZZWORDS;
