/**
 * relativeTime — turn a unix-millis timestamp into a short human label.
 *
 * Output forms (matches the extension popup precedent + Phase 5 UI-SPEC
 * §`/dashboard` page line 310):
 *   < 60 seconds: 'just now'
 *   < 60 minutes: '{N}m ago'
 *   < 24 hours:   '{N}h ago'
 *   < 48 hours:   'yesterday'
 *   < 7 days:     '{Mon|Tue|Wed|...}'  (weekday short)
 *   < 365 days:   '{Mon} {DD}'         (e.g. 'Mar 5')
 *   ≥ 365 days:   '{Mon} {DD}, {YYYY}' (e.g. 'Mar 5, 2024')
 *
 * Pure — no localStorage, no Intl side effects. Accepts an optional `now`
 * for testability (defaults to Date.now()).
 *
 * Under noUncheckedIndexedAccess, WEEKDAY[date.getDay()] is `string | undefined`;
 * the `?? 'Unknown'` fallback is required (matches Phase 4 popup helper precedent).
 * WEEKDAY ordering follows JS `Date.prototype.getDay()` which returns 0-6
 * starting with Sunday.
 */

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function relativeTime(
  timestamp: number,
  now: number = Date.now(),
): string {
  const delta = Math.max(0, now - timestamp);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 2) return 'yesterday';
  const date = new Date(timestamp);
  if (days < 7) return WEEKDAY[date.getDay()] ?? 'Unknown';
  const month = MONTH[date.getMonth()] ?? 'Unknown';
  const day = date.getDate();
  if (days < 365) return `${month} ${day}`;
  return `${month} ${day}, ${date.getFullYear()}`;
}
