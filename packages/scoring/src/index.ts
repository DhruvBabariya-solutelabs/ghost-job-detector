import type { AnalyzeResponse, JobPosting, SignalResult } from '@ghost/shared';
import type OpenAI from 'openai';

import { aggregate } from './aggregate.js';
import { extractAiText } from './extractors/aiText.js';
import { extractBuzzword } from './extractors/buzzword.js';
import { extractLlmEval } from './extractors/llmEval.js';
import { extractScam } from './extractors/scam.js';
import { extractSpecificity } from './extractors/specificity.js';
import { isLikelyJobPosting } from './extractors/triage.js';
import { degradedSignal } from './extractors/types.js';
import { DOMINANT_NEGATIVE_REASON, label } from './label.js';

export interface AnalyzeDeps {
  ai: OpenAI | null;
  now?: () => number;
}

const AI_MODEL = 'openai/gpt-4o-mini';

function notAJobPostingResponse(model: string, start: number, deps: AnalyzeDeps): AnalyzeResponse {
  return {
    score: 50,
    risk: 'caution',
    reasons: [{ ...DOMINANT_NEGATIVE_REASON, signalKey: 'specificity' }],
    signalBreakdown: [],
    meta: {
      usedAi: false,
      model: deps.ai !== null ? model : 'heuristics-only',
      durationMs: (deps.now ?? Date.now)() - start,
    },
  };
}

export async function analyzeJob(posting: JobPosting, deps: AnalyzeDeps): Promise<AnalyzeResponse> {
  const start = (deps.now ?? Date.now)();

  if (!isLikelyJobPosting(posting)) {
    return notAJobPostingResponse(AI_MODEL, start, deps);
  }

  const heuristic: SignalResult[] = [
    extractBuzzword(posting),
    extractSpecificity(posting),
    extractScam(posting),
  ];

  const aiSignals: SignalResult[] = deps.ai
    ? await Promise.all([
        extractAiText(posting, deps.ai).catch(() => degradedSignal('ai')),
        extractLlmEval(posting, deps.ai).catch(() => degradedSignal('llm')),
      ])
    : [];

  const allSignals: SignalResult[] = [...heuristic, ...aiSignals];

  const aggregated = aggregate(allSignals);

  const labeled = label(aggregated, allSignals, posting);

  return {
    score: aggregated.score,
    risk: labeled.risk,
    reasons: labeled.reasons,
    signalBreakdown: aggregated.breakdown,
    meta: {
      usedAi: deps.ai !== null,
      model: deps.ai !== null ? AI_MODEL : 'heuristics-only',
      durationMs: (deps.now ?? Date.now)() - start,
    },
  };
}

export { makeAiClient } from './openaiClient.js';
