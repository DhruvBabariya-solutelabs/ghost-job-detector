import type { SignalBreakdownEntry, SignalKey, SignalResult } from '@ghost/shared';

const DEFAULT_WEIGHTS: Record<SignalKey, number> = {
  ai: 0.3,
  specificity: 0.25,
  buzzword: 0.2,
  scam: 0.15,
  llm: 0.1,
};

export function aggregate(signals: SignalResult[]): {
  score: number;
  breakdown: SignalBreakdownEntry[];
} {
  const present = signals.filter((s) => s.confidence > 0);

  if (present.length === 0) {
    return { score: 50, breakdown: [] };
  }

  const presentWeightSum = present.reduce((sum, s) => sum + (DEFAULT_WEIGHTS[s.key] ?? 0), 0);

  let weights = new Map<SignalKey, number>(
    present.map((s) => [s.key, (DEFAULT_WEIGHTS[s.key] ?? 0) / presentWeightSum]),
  );

  const spec = present.find((s) => s.key === 'specificity');
  const buzz = present.find((s) => s.key === 'buzzword');

  if (
    spec !== undefined &&
    buzz !== undefined &&
    spec.ghostiness <= 0.2 &&
    buzz.ghostiness >= 0.6
  ) {
    const currentBuzzWeight = weights.get('buzzword');
    if (currentBuzzWeight !== undefined) {
      weights.set('buzzword', currentBuzzWeight * 0.5);
      const newSum = [...weights.values()].reduce((a, b) => a + b, 0);
      weights = new Map([...weights.entries()].map(([k, w]) => [k, w / newSum]));
    }
  }

  const breakdown: SignalBreakdownEntry[] = present.map((s) => {
    const w = weights.get(s.key) ?? 0;
    const ghost100 = s.ghostiness * 100;
    return {
      key: s.key,
      ghostiness: ghost100,
      confidence: s.confidence,
      weight: w,
      contribution: ghost100 * w,
    };
  });

  const totalGhostiness = breakdown.reduce((sum, b) => sum + b.contribution, 0);
  return { score: Math.round(100 - totalGhostiness), breakdown };
}
