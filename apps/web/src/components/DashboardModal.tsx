'use client';

/**
 * DashboardModal — read-only viewer for a single saved analysis (UI-SPEC
 * §`/dashboard` page §"Read-only modal" lines 758-769).
 *
 * Surfaces:
 *   - role="dialog" + aria-modal="true" + aria-labelledby for screen readers
 *   - Focus moves to the X close button on mount (UI-SPEC §Accessibility line 1095)
 *   - Escape key + backdrop click + X button all dismiss
 *   - Body scroll lock while open (state restored on unmount)
 *   - ScoreDial at size=128 + RiskLabel + ReasonsList + SignalBreakdownDrawer
 *     (same component vocabulary as /analyze — read-only here, no Save button)
 *   - Delete-from-history with two-click inline confirm (4s auto-dismiss).
 *     First click reveals "Click again to confirm" pill; second click within
 *     the window calls onDelete (UI-SPEC line 316).
 *
 * Focus-trap (tab-cycle within the modal) is deferred to Phase 8 polish per
 * UI-SPEC line 1094 — Phase 5 ships focus-on-open + Escape, which is enough
 * for the demo flow.
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { HistoryEntry } from '@/lib/storage';
import { ScoreDial } from './ScoreDial';
import { RiskLabel } from './RiskLabel';
import { ReasonsList } from './ReasonsList';
import { SignalBreakdownDrawer } from './SignalBreakdownDrawer';

export interface DashboardModalProps {
  entry: HistoryEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3 L13 13 M13 3 L3 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashboardModal({
  entry,
  onClose,
  onDelete,
}: DashboardModalProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const titleId = useId();
  const drawerId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Mount: focus the close button + attach Escape listener + lock body scroll.
  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Delete-confirm 4s auto-dismiss window (UI-SPEC line 317).
  useEffect(() => {
    if (!deleteConfirm) return;
    const t = setTimeout(() => setDeleteConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [deleteConfirm]);

  const handleDelete = (): void => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    onDelete(entry.id);
  };

  const fullDate = new Date(entry.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const { score, risk, reasons, signalBreakdown } = entry.response;
  const { title, company, location } = entry.posting;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop — click-outside closes. aria-hidden suppresses a11y lint rules
          for useKeyWithClickEvents + noStaticElementInteractions — keyboard users
          dismiss via Escape (line 73) or X-button (focused on mount, line 67). */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/40 transition-opacity duration-200"
      />

      {/* Modal panel */}
      <div className="relative max-w-[480px] w-[90vw] max-h-[80vh] overflow-y-auto bg-[--color-surface] rounded-xl shadow-[--shadow-overlay] p-6">
        {/* Header: title + sub-title + X dismiss */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold text-[--color-ink] truncate"
              title={title}
            >
              {title || '(no title)'}
            </h2>
            <p className="text-sm text-[--color-ink-muted] truncate">
              {`${company || '(no company)'} · ${location || '(no location)'} · analyzed ${fullDate}`}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 grid place-items-center rounded-sm hover:bg-[--color-surface-subtle] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
          >
            <XIcon />
          </button>
        </div>

        {/* Score block — read-only ScoreDial(128) + RiskLabel + reasons + drawer */}
        <div className="flex flex-col items-center gap-3">
          <ScoreDial
            score={score}
            risk={risk}
            size={128}
            drawerOpen={drawerOpen}
            onToggleDrawer={() => setDrawerOpen((o) => !o)}
            drawerId={drawerId}
          />
          <RiskLabel band={risk} />
          <div className="w-full">
            <ReasonsList reasons={reasons} />
          </div>
          <div className="w-full">
            <SignalBreakdownDrawer
              breakdown={signalBreakdown}
              open={drawerOpen}
              band={risk}
              drawerId={drawerId}
            />
          </div>
        </div>

        {/* Footer: Delete from history with inline-confirm */}
        <div className="mt-6 flex items-center justify-end gap-2">
          {deleteConfirm && (
            <span
              className="text-xs inline-block px-2 py-1 rounded-sm"
              style={{
                backgroundColor:
                  'color-mix(in oklch, #dc2626 12%, transparent)',
                color: '#b91c1c',
              }}
            >
              Click again to confirm
            </span>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-medium text-[--color-ink-muted] hover:text-[--color-ink] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)] rounded-sm px-2 py-1"
          >
            Delete from history
          </button>
        </div>
      </div>
    </div>
  );
}
