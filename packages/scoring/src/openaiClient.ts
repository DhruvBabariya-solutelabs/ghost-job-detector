import OpenAI from 'openai';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export function makeAiClient(apiKey: string | null | undefined): OpenAI | null {
  if (!apiKey || !apiKey.trim()) return null;
  return new OpenAI({
    apiKey: apiKey.trim(),
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': 'https://ghost-job-detector.vercel.app',
      'X-Title': 'Ghost Job Detector',
    },
    maxRetries: 0,
  });
}
