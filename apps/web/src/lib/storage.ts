import type { AnalyzeResponse, JobPosting } from '@ghost/shared';

const KEY_API = 'gjd:apiKey' as const;
const KEY_HISTORY = 'gjd:analyses:v1' as const;
const HISTORY_CAP = 50;

export type StorageWriteResult =
  | { kind: 'ok' }
  | { kind: 'quota_exceeded' }
  | { kind: 'unavailable' };

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(KEY_API);
  } catch {
    return null;
  }
}

export function setApiKey(raw: string): StorageWriteResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };
  const sanitized = raw.trim().replace(/^["']|["']$/g, '');
  try {
    localStorage.setItem(KEY_API, sanitized);
    return { kind: 'ok' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { kind: 'quota_exceeded' };
    }
    return { kind: 'unavailable' };
  }
}

export function clearApiKey(): StorageWriteResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };
  try {
    localStorage.removeItem(KEY_API);
    return { kind: 'ok' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { kind: 'quota_exceeded' };
    }
    return { kind: 'unavailable' };
  }
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  posting: JobPosting;
  response: AnalyzeResponse;
}

export type GetHistoryResult =
  | { kind: 'ok'; entries: HistoryEntry[] }
  | { kind: 'corrupted' }
  | { kind: 'unavailable' };

export function getHistory(): GetHistoryResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };

  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY_HISTORY);
  } catch {
    return { kind: 'unavailable' };
  }

  if (raw === null) return { kind: 'ok', entries: [] };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { kind: 'ok', entries: parsed as HistoryEntry[] };
    }
    return { kind: 'corrupted' };
  } catch {
    return { kind: 'corrupted' };
  }
}

export function pushHistory(entry: HistoryEntry): StorageWriteResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };

  const current = getHistory();
  if (current.kind === 'unavailable') return { kind: 'unavailable' };

  const entries: HistoryEntry[] = current.kind === 'ok' ? current.entries : [];

  const filtered = entries.filter((e) => e.id !== entry.id);
  const next = [entry, ...filtered];
  const capped = next.slice(0, HISTORY_CAP);

  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(capped));
    return { kind: 'ok' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { kind: 'quota_exceeded' };
    }
    return { kind: 'unavailable' };
  }
}

export function clearHistory(): StorageWriteResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };
  try {
    localStorage.removeItem(KEY_HISTORY);
    return { kind: 'ok' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { kind: 'quota_exceeded' };
    }
    return { kind: 'unavailable' };
  }
}

export function removeHistoryById(id: string): StorageWriteResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };
  const current = getHistory();
  if (current.kind === 'unavailable') return { kind: 'unavailable' };
  if (current.kind === 'corrupted') {
    return clearHistory();
  }
  const filtered = current.entries.filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(filtered));
    return { kind: 'ok' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { kind: 'quota_exceeded' };
    }
    return { kind: 'unavailable' };
  }
}
