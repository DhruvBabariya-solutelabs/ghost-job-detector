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
const KEY_THEME = 'gjd:theme' as const;
const KEY_ONBOARDED = 'gjd:onboarded' as const;
const KEY_DODGED = 'gjd:ghostsDodged' as const;
const HISTORY_CAP = 50;

/** UI surfaces (popup + side-panel) only — the in-page overlay never reads this. */
export type ThemePref = 'dark' | 'light';

/**
 * Read the persisted theme preference for the extension pages. Returns null when
 * the user has never toggled — the UI then falls back to dark (brand default)
 * after consulting prefers-color-scheme. Innocuous UI pref; safe to read direct
 * from the popup gateway (mirrors the options page's getApiKey usage).
 */
export async function getTheme(): Promise<ThemePref | null> {
  const result = await chrome.storage.local.get(KEY_THEME);
  const value = result[KEY_THEME];
  return value === 'dark' || value === 'light' ? value : null;
}

/** Persist the theme preference toggled from the popup / side-panel header. */
export async function setTheme(theme: ThemePref): Promise<void> {
  await chrome.storage.local.set({ [KEY_THEME]: theme });
}

/** Whether the 3-step onboarding has been completed (first-run gate). */
export async function getOnboarded(): Promise<boolean> {
  const result = await chrome.storage.local.get(KEY_ONBOARDED);
  return result[KEY_ONBOARDED] === true;
}

/** Mark onboarding complete so it never auto-shows again. */
export async function setOnboarded(): Promise<void> {
  await chrome.storage.local.set({ [KEY_ONBOARDED]: true });
}

/**
 * Lifetime count of suspicious / ghost verdicts the user has seen — the
 * "Ghosts dodged" engagement counter. Persisted independently of the 50-cap
 * history so it survives pruning. Incremented by pushHistory below.
 */
export async function getGhostsDodged(): Promise<number> {
  const result = await chrome.storage.local.get(KEY_DODGED);
  const value = result[KEY_DODGED];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

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

  // Engagement counter: a "ghost dodged" is any suspicious/ghost verdict the
  // user was warned about. Tracked separately from history so the lifetime
  // total survives the 50-entry prune. Demo fixtures count too (they ARE the
  // warnings shown in the demo).
  if (response.risk === 'suspicious' || response.risk === 'ghost') {
    const dodged = await getGhostsDodged();
    await chrome.storage.local.set({ [KEY_DODGED]: dodged + 1 });
  }
}
