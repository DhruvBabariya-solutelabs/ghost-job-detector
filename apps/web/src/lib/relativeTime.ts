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

export function relativeTime(timestamp: number, now: number = Date.now()): string {
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
