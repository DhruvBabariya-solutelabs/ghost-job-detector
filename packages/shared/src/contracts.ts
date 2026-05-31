import { z } from 'zod';
import type { RiskBand } from './risk.js';

export const JobPostingSchema = z.object({
  title: z.string().min(1).max(500),
  company: z.string().max(300).default(''),
  location: z.string().max(300).default(''),
  description: z.string().min(20).max(50_000),
  sourceUrl: z.string().url().optional(),
});

export type JobPosting = z.infer<typeof JobPostingSchema>;

export type JobPostingInput = z.input<typeof JobPostingSchema>;

export type AnalyzeRequest = JobPosting;

export type SignalKey = 'buzzword' | 'specificity' | 'scam' | 'ai' | 'llm';

export interface SignalResult {
  key: SignalKey;
  ghostiness: number;
  confidence: number;
  evidence: string[];
}

export interface SignalBreakdownEntry {
  key: SignalKey;
  ghostiness: number;
  confidence: number;
  weight: number;
  contribution: number;
}

export interface Reason {
  text: string;
  signed: number;
  evidenceQuote?: string;
  signalKey: SignalKey;
}

export interface AnalyzeResponse {
  score: number;
  risk: RiskBand;
  reasons: Reason[];
  signalBreakdown: SignalBreakdownEntry[];
  meta: {
    usedAi: boolean;
    model: string;
    durationMs?: number;
  };
}

export const ANALYZE_HEADER_KEY = 'x-openrouter-key' as const;

export const ANALYZE_PATH = '/api/analyze-job' as const;

export const ANALYZE_BASE_URL = 'http://localhost:3000' as const;
