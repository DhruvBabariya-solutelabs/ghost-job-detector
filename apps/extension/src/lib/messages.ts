import type { AnalyzeResponse, JobPosting, RiskBand } from '@ghost/shared';

export type RpcRequest =
  | { type: 'ANALYZE'; payload: JobPosting }
  | { type: 'LOAD_DEMO'; band: RiskBand }
  | { type: 'TEST_KEY'; payload: string }
  | { type: 'GET_HISTORY' };

export type RpcResponse =
  | { ok: true; data: AnalyzeResponse }
  | { ok: true; history: HistoryEntry[] }
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; reason: 'invalid' | 'rate_limit' | 'network' };

export interface HistoryEntry {
  id: string;
  timestamp: number;
  posting: JobPosting;
  response: AnalyzeResponse;
}
