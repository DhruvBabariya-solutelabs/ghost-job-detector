/**
 * Thin gateway over chrome.storage.local for the BYOK key + last-50 history.
 *
 * Why a gateway:
 * - Single source for the namespaced keys (`gjd:apiKey`, `gjd:history`)
 *   — RESEARCH "Don't Hand-Roll" (no raw chrome.storage.local.get/set scattered).
 * - Centralizes the 50-cap pruning so callers can't forget (D-13 / EXT-13).
 * - Centralizes whitespace + quote sanitization at write time per D-51.
 * - SW lifecycle invariant: every handler re-reads via these helpers — no
 *   module-level cache (chrome.storage.local IS the single source of truth).
 *
 * Why .local (not .sync): chrome.storage.sync would cross-pollinate the
 * user's BYOK key across all signed-in Chrome devices — privacy violation.
 * Per PITFALLS "chrome.storage" + RESEARCH Anti-Patterns.
 *
 * 2026-05 — BYOK provider switched from OpenAI to OpenRouter. Storage key
 * renamed from `gjd:openaiApiKey` to `gjd:apiKey` (provider-neutral); any
 * previously-stored OpenAI key is silently abandoned (would fail server-side
 * anyway). No migration shim — pre-launch, no users.
 */

import type { JobPosting, AnalyzeResponse } from '@ghost/shared';
import type { HistoryEntry } from './messages.js';

const KEY_API = 'gjd:apiKey' as const;
const KEY_HISTORY = 'gjd:history' as const;
const HISTORY_CAP = 50;

/**
 * Read the saved BYOK key. Returns null if not set, blank, or whitespace-only.
 * Result is .trim()'d at read time as a belt-and-suspenders against any
 * pre-sanitization-era value persisted from a previous extension version.
 */
export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(KEY_API);
  const value = result[KEY_API];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Save the BYOK key. Sanitizes whitespace + surrounding quotes per D-51:
 * `value.trim().replace(/^["']|["']$/g, '')`. Format regex (e.g. /^sk-or-v1-.../)
 * is the options page's responsibility — not enforced here.
 */
export async function setApiKey(key: string): Promise<void> {
  const sanitized = key.trim().replace(/^["']|["']$/g, '');
  await chrome.storage.local.set({ [KEY_API]: sanitized });
}

/**
 * Read the last-50 history list. Returns [] if unset or malformed.
 * Newest-first ordering by `pushHistory` write convention.
 */
export async function readHistory(): Promise<HistoryEntry[]> {
  const result = await chrome.storage.local.get(KEY_HISTORY);
  const value = result[KEY_HISTORY];
  return Array.isArray(value) ? (value as HistoryEntry[]) : [];
}

/**
 * Append a new history entry, prune to top-50 newest-first, persist.
 * The synthetic `id` field is `${Date.now()}-${random6}` (collision-safe
 * across rapid soft-nav re-extractions).
 */
export async function pushHistory(posting: JobPosting, response: AnalyzeResponse): Promise<void> {
  const current = await readHistory();
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    posting,
    response,
  };
  const next = [entry, ...current].slice(0, HISTORY_CAP);
  await chrome.storage.local.set({ [KEY_HISTORY]: next });
}
