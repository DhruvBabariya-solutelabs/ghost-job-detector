/**
 * Scan history — newest-first rows of past analyses. Each row: a score chip
 * tinted to the verdict, the posting title, and relative time. Click a row to
 * load it into the hero. The active row is highlighted.
 */

import type { HistoryEntry } from '@/src/lib/messages';
import { VERDICTS } from './verdict';

interface HistoryListProps {
  entries: HistoryEntry[];
  selectedId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  /** Cap rows (popup); side-panel passes Infinity. */
  limit?: number;
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function HistoryList({ entries, selectedId, onSelect, limit = 5 }: HistoryListProps) {
  const visible = entries.slice(0, limit);

  if (visible.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--ink-muted)' }}>
        No scans yet. Try a sample, or open a LinkedIn / Indeed job.
      </p>
    );
  }

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {visible.map((entry) => {
        const v = VERDICTS[entry.response.risk];
        const active = entry.id === selectedId;
        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              aria-current={active}
              className="gjd-focus gjd-row gjd-tnum"
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '7px 8px',
                borderRadius: 'var(--r-card)',
                cursor: 'pointer',
                background: active ? 'var(--surface-2)' : undefined,
                boxShadow: active ? 'inset 2px 0 0 var(--v-solid)' : undefined,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 24,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 7,
                  fontSize: 'var(--t-sm)',
                  fontWeight: 700,
                  color: `light-dark(${v.deep}, ${v.from})`,
                  background: `color-mix(in oklab, ${v.solid} 14%, transparent)`,
                }}
              >
                {entry.response.score}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 'var(--t-sm)',
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {entry.posting.title || '(no title)'}
              </span>
              <span style={{ flexShrink: 0, fontSize: 'var(--t-2xs)', color: 'var(--ink-faint)' }}>
                {relativeTime(entry.timestamp)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
