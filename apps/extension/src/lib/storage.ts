import type { AnalyzeResponse, JobPosting } from '@ghost/shared';
import type { HistoryEntry } from './messages.js';

const KEY_API = 'gjd:apiKey' as const;
const KEY_HISTORY = 'gjd:history' as const;
const KEY_THEME = 'gjd:theme' as const;
const KEY_ONBOARDED = 'gjd:onboarded' as const;
const KEY_DODGED = 'gjd:ghostsDodged' as const;
const HISTORY_CAP = 50;

export type ThemePref = 'dark' | 'light';

export async function getTheme(): Promise<ThemePref | null> {
  const result = await chrome.storage.local.get(KEY_THEME);
  const value = result[KEY_THEME];
  return value === 'dark' || value === 'light' ? value : null;
}

export async function setTheme(theme: ThemePref): Promise<void> {
  await chrome.storage.local.set({ [KEY_THEME]: theme });
}

export async function getOnboarded(): Promise<boolean> {
  const result = await chrome.storage.local.get(KEY_ONBOARDED);
  return result[KEY_ONBOARDED] === true;
}

export async function setOnboarded(): Promise<void> {
  await chrome.storage.local.set({ [KEY_ONBOARDED]: true });
}

export async function getGhostsDodged(): Promise<number> {
  const result = await chrome.storage.local.get(KEY_DODGED);
  const value = result[KEY_DODGED];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(KEY_API);
  const value = result[KEY_API];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function setApiKey(key: string): Promise<void> {
  const sanitized = key.trim().replace(/^["']|["']$/g, '');
  await chrome.storage.local.set({ [KEY_API]: sanitized });
}

export async function clearApiKey(): Promise<void> {
  await chrome.storage.local.remove(KEY_API);
}

export async function readHistory(): Promise<HistoryEntry[]> {
  const result = await chrome.storage.local.get(KEY_HISTORY);
  const value = result[KEY_HISTORY];
  return Array.isArray(value) ? (value as HistoryEntry[]) : [];
}

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

  if (response.risk === 'suspicious' || response.risk === 'ghost') {
    const dodged = await getGhostsDodged();
    await chrome.storage.local.set({ [KEY_DODGED]: dodged + 1 });
  }
}
