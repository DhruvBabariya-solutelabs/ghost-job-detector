/**
 * Typed RPC contracts for the chrome.runtime message channel between
 * content script ↔ service worker ↔ popup ↔ options page.
 *
 * Discriminated union on `type` (request) and `ok` (response) — `noImplicitAny`
 * + closed-literal narrowing means TypeScript catches missing switch cases.
 *
 * Phase 4 ships 4 request types: ANALYZE, LOAD_DEMO, TEST_KEY, GET_HISTORY.
 * Phase 6 swaps only the ANALYZE handler BODY in background.ts; this contract
 * is stable across the swap.
 */

import type { AnalyzeResponse, JobPosting, RiskBand } from '@ghost/shared';

export type RpcRequest =
  | { type: 'ANALYZE'; payload: JobPosting }
  | { type: 'LOAD_DEMO'; band: RiskBand }
  | { type: 'TEST_KEY'; payload: string }
  | { type: 'GET_HISTORY' };

/**
 * Response envelope. Multiple `ok: true` variants are discriminated by which
 * data field is present — TypeScript narrows correctly because the property
 * sets are disjoint.
 */
export type RpcResponse =
  | { ok: true; data: AnalyzeResponse } // ANALYZE + LOAD_DEMO
  | { ok: true; history: HistoryEntry[] } // GET_HISTORY
  | { ok: true } // TEST_KEY success
  | { ok: false; error: string } // generic try/catch path
  | { ok: false; reason: 'invalid' | 'rate_limit' | 'network' }; // TEST_KEY specific failures

/**
 * Single history record persisted to chrome.storage.local['gjd:history'].
 * Capped at 50 entries (prune on write); newest-first ordering.
 */
export interface HistoryEntry {
  /** Synthetic ID — `${Date.now()}-${random6}`. Used as React keys in popup. */
  id: string;
  /** Date.now() at write time. */
  timestamp: number;
  posting: JobPosting;
  response: AnalyzeResponse;
}
