import type { SignalKey, SignalResult } from '@ghost/shared';

export function degradedSignal(key: SignalKey): SignalResult {
  return { key, ghostiness: 0, confidence: 0, evidence: [] };
}
