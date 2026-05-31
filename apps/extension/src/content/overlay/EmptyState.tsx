/**
 * EmptyState — the D-60 "couldn't read this posting" surface + the network-error
 * variant. Dark premium glass, matching the result overlay.
 *
 * Self-contained shell: renders its own .gjd-ov-card container + OverlayHeader so
 * content.ts can render <EmptyState/> directly when the adapter returned null
 * after the 5-second MutationObserver retry.
 *
 * External link safety: target="_blank" rel="noopener" defeats reverse
 * tabnabbing (T-04-40 STRIDE mitigation).
 */

import { OverlayHeader } from './OverlayHeader.js';

interface IconProps {
  className?: string;
}

/** Open-book SVG glyph — minimal line art. */
function OpenBookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 6 L12 19" />
      <path d="M4 6 C 6.5 6, 9.5 6.5, 12 7.5 L 12 19 C 9.5 18, 6.5 17.5, 4 17.5 Z" />
      <path d="M20 6 C 17.5 6, 14.5 6.5, 12 7.5 L 12 19 C 14.5 18, 17.5 17.5, 20 17.5 Z" />
    </svg>
  );
}

/** Right-chevron glyph for the CTA. */
function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 2.5 L8 6 L4.5 9.5" />
    </svg>
  );
}

export interface EmptyStateProps {
  onDismiss: () => void;
  /** When true, renders the network-error variant with a Retry button instead
   *  of the extraction-failure copy. Pass onRetry to wire the Retry action. */
  isNetworkError?: boolean;
  /** Called when the user clicks "Retry" in the network-error variant. */
  onRetry?: () => void;
}

const SHELL =
  'gjd-ov-card fixed top-4 right-4 w-80 overflow-hidden font-sans z-[2147483647]';
const CTA =
  'inline-flex items-center gap-1 mt-2 text-sm font-semibold text-(--ov-brand) hover:underline focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#7c5cff66] rounded-sm';

export function EmptyState({ onDismiss, isNetworkError, onRetry }: EmptyStateProps) {
  if (isNetworkError) {
    return (
      <div className={SHELL}>
        <OverlayHeader onDismiss={onDismiss} />
        <div className="p-8 flex flex-col items-center gap-3 text-center">
          <OpenBookIcon className="w-6 h-6 text-(--ov-ink-muted)" />
          <h2 className="text-base font-semibold text-(--ov-ink)">Analysis failed</h2>
          <p className="text-sm text-(--ov-ink-muted) text-center max-w-[240px] mx-auto">
            Network error — check your connection and try again.
          </p>
          <button type="button" onClick={() => onRetry?.()} className={CTA}>
            Retry
            <ChevronRightIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={SHELL}>
      <OverlayHeader onDismiss={onDismiss} />
      <div className="p-8 flex flex-col items-center gap-3 text-center">
        <OpenBookIcon className="w-6 h-6 text-(--ov-ink-muted)" />
        <h2 className="text-base font-semibold text-(--ov-ink)">Couldn't read this posting</h2>
        <p className="text-sm text-(--ov-ink-muted) text-center max-w-[240px] mx-auto">
          Ghost Job Detector didn't recognize this page layout. Try analyzing it in the web app
          instead — paste the description and we'll score it the same way.
        </p>
        <a
          href="https://ghost-job-detector.vercel.app/analyze"
          target="_blank"
          rel="noopener"
          className={CTA}
        >
          Open web analyzer
          <ChevronRightIcon className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
