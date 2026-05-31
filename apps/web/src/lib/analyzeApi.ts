import type { AnalyzeRequest, AnalyzeResponse } from '@ghost/shared';
import { ANALYZE_HEADER_KEY, ANALYZE_PATH } from '@ghost/shared';
import { getApiKey } from '@/lib/storage';

export async function analyzeApi(input: AnalyzeRequest): Promise<AnalyzeResponse> {
  const key = getApiKey() ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [ANALYZE_HEADER_KEY]: key,
  };
  const res = await fetch(ANALYZE_PATH, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`analyze-job failed: ${res.status}`);
  }
  return (await res.json()) as AnalyzeResponse;
}
