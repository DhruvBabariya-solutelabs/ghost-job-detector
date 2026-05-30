/**
 * Thin gateway over browser localStorage for the BYOK key + last-50 history.
 *
 * Gateway invariant:
 * - This is the ONLY module in apps/web that reads or writes localStorage.
 *   Every WEB-* surface (SettingsDrawer, /analyze, /dashboard) routes through
 *   the exports here. The two key strings ('gjd:apiKey', 'gjd:analyses:v1')
 *   live in EXACTLY one place — this file. (Mirrors apps/extension/src/lib/storage.ts.)
 *
 * 2026-05 — BYOK provider switched from OpenAI to OpenRouter. Storage key
 * renamed from `gjd:openaiApiKey` to `gjd:apiKey` (provider-neutral); any
 * previously-stored OpenAI key in localStorage is silently abandoned (would
 * fail server-side anyway). No migration shim — pre-launch, no users.
 *
 * Key responsibilities:
 * - BYOK key persistence to `gjd:apiKey` per WEB-09. Sanitizes whitespace
 *   and wrapping ASCII single/double quotes at write time per D-51:
 *   `value.trim().replace(/^["']|["']$/g, '')`.
 * - History persistence to `gjd:analyses:v1` per WEB-07 / D-68. The `v1` suffix
 *   is intentional — future schema migrations get their own version key.
 * - Capped at HISTORY_CAP = 50 entries (oldest pruned at write-time per D-68).
 * - id-based dedupe on write so saving the same entry twice doesn't accidentally
 *   evict 50 valid entries.
 * - Discriminated-union return types (StorageWriteResult, GetHistoryResult) so
 *   callers can render error states (quota_exceeded → "Couldn't save the key"
 *   pill per UI-SPEC line 1408; corrupted → /dashboard "Clear corrupted data"
 *   button per UI-SPEC line 1409) without try/catch ceremony in components.
 * - SSR-safe — every export bails early with `typeof window === 'undefined'`
 *   so Next.js App Router server components import without throwing.
 *
 * Security gate (T-05-05): NO console.log / console.warn / console.error /
 * console.debug / console.info anywhere in this file. The BYOK key MUST NEVER
 * be logged. Try/catch blocks here MUST NOT log the caught error.
 *
 * Why localStorage (not chrome.storage): apps/web is a regular browser site;
 * chrome.storage APIs are extension-only. The data shape and policy mirror
 * apps/extension/src/lib/storage.ts so a future packages/ui extraction can
 * unify the two gateways behind a single interface (deferred to v2 per
 * CLAUDE.md duplicated-v1 convention).
 */

import type { AnalyzeResponse, JobPosting } from '@ghost/shared';

// localStorage key strings — the single source of truth for apps/web.
const KEY_API = 'gjd:apiKey' as const;
const KEY_HISTORY = 'gjd:analyses:v1' as const;
const HISTORY_CAP = 50;

// ---------------------------------------------------------------------------
// BYOK key gateway (WEB-09 + D-51)
// ---------------------------------------------------------------------------

/**
 * Discriminated result for write paths. Callers narrow on `kind` and surface
 * the matching UI affordance — quota_exceeded → save-failure pill, unavailable
 * → silent no-op (storage disabled / private browsing). No throws.
 */
export type StorageWriteResult =
  | { kind: 'ok' }
  | { kind: 'quota_exceeded' }
  | { kind: 'unavailable' };

/**
 * Read the saved BYOK key string from localStorage, or null if unset.
 * SSR-safe. Returns null on any thrown access (Safari private-browsing,
 * strict-privacy extensions, disabled storage). Does NOT trim — D-51
 * sanitization happened at write, and the value persisted is canonical.
 */
export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(KEY_API);
  } catch {
    return null;
  }
}

/**
 * Save the BYOK key. Applies D-51 sanitization at write —
 * `value.trim().replace(/^["']|["']$/g, '')` — strips whitespace and matched
 * wrapping ASCII single/double quotes (idempotent). Format regex (e.g.
 * /^sk-or-v1-.../) is the SettingsDrawer's responsibility, not this gateway's.
 *
 * Returns:
 * - { kind: 'ok' } on success.
 * - { kind: 'quota_exceeded' } when the browser raises QuotaExceededError
 *   (surfaces the "Couldn't save the key" pill per UI-SPEC line 1408).
 * - { kind: 'unavailable' } on SSR or any other thrown access.
 */
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

/**
 * Remove the saved BYOK key entirely. The SettingsDrawer has no Clear button
 * in v1 (UI-SPEC line 391 — `setApiKey('')` is the canonical clear), but
 * this helper exists for Phase 8 polish and parity with the history surface.
 */
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

// ---------------------------------------------------------------------------
// History gateway (WEB-07 + D-68)
// ---------------------------------------------------------------------------

/**
 * Single history record persisted to `gjd:analyses:v1`. Shape locked by D-68 —
 * intentionally NO `apiKey` field (T-05-06: BYOK key MUST NEVER be written to
 * the history bucket alongside the posting). Type system enforces this.
 */
export interface HistoryEntry {
  /** Caller-supplied stable id (nanoid-style); used for dedupe-on-write + React keys. */
  id: string;
  /** Date.now() at save time — drives relative-timestamp display in /dashboard cards. */
  timestamp: number;
  posting: JobPosting;
  response: AnalyzeResponse;
}

/**
 * Discriminated read result. `corrupted` surfaces the /dashboard "Clear
 * corrupted data" affordance (UI-SPEC line 1409 — "It'll start fresh on your
 * next save"). `unavailable` (SSR / storage disabled) renders the empty
 * state — same visual as `kind: 'ok', entries: []`.
 */
export type GetHistoryResult =
  | { kind: 'ok'; entries: HistoryEntry[] }
  | { kind: 'corrupted' }
  | { kind: 'unavailable' };

/**
 * Read the persisted history list. SSR-safe; never throws.
 *
 * Returns:
 * - { kind: 'ok', entries: [] } when the bucket is unset (first visit).
 * - { kind: 'ok', entries } when JSON.parse succeeds AND the result is an array.
 *   We do NOT zod-validate individual entries — the /dashboard render path is
 *   forgiving of partial fields (missing title falls back to "(no title)" per
 *   UI-SPEC line 308), and strict validation would force a corrupted-state
 *   render for any partial entry. v2 may revisit.
 * - { kind: 'corrupted' } when JSON.parse throws OR the parsed value is not
 *   an array. /dashboard renders the corrupted-data error state.
 * - { kind: 'unavailable' } on SSR or any other thrown localStorage access.
 */
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

/**
 * Append a history entry. Dedupes by `entry.id` (so saving the same posting
 * twice doesn't accidentally evict 50 unique entries), prepends newest-first,
 * caps at HISTORY_CAP = 50 (oldest pruned at write per D-68), then writes.
 *
 * When the existing bucket is corrupted, we start fresh — the new entry
 * overwrites the malformed payload. This matches UI-SPEC line 1409's
 * "It'll start fresh on your next save" semantic.
 *
 * Returns the same StorageWriteResult shape as setApiKey — quota_exceeded
 * surfaces the same save-failure affordance.
 */
export function pushHistory(entry: HistoryEntry): StorageWriteResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };

  const current = getHistory();
  if (current.kind === 'unavailable') return { kind: 'unavailable' };

  // On corrupted: treat as empty + overwrite on this write.
  const entries: HistoryEntry[] = current.kind === 'ok' ? current.entries : [];

  // Dedupe by id BEFORE capping — keeps the 50-cap accounting honest.
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

/**
 * Remove the history bucket entirely. Powers the /dashboard "Clear corrupted
 * data" button (UI-SPEC line 1409) and any future "Clear history" affordance.
 */
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

/**
 * Remove a single history entry by id. Returns 'ok' if found+removed OR if not
 * found (idempotent — calling remove on a non-existent id is a no-op success).
 * On corrupted state: clear the key (matches the corrupted-recovery semantic
 * from UI-SPEC line 1409 — "It'll start fresh on your next save").
 * Returns 'unavailable' on SSR / disabled localStorage.
 */
export function removeHistoryById(id: string): StorageWriteResult {
  if (typeof window === 'undefined') return { kind: 'unavailable' };
  const current = getHistory();
  if (current.kind === 'unavailable') return { kind: 'unavailable' };
  if (current.kind === 'corrupted') {
    // Treat corrupted as empty — clear the key and report ok.
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
