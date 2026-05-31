interface IconProps {
  className?: string;
}

function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4 L12 12" />
      <path d="M12 4 L4 12" />
    </svg>
  );
}

function GhostIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path
        d="M3 14.5V8a6 6 0 0 1 12 0v6.5c0 .35-.4.55-.7.3l-1.55-1.25-1.6 1.3c-.22.18-.55.18-.77 0L9 13.55l-1.38 1.3c-.22.18-.55.18-.77 0L5.25 13.55 3.7 14.8c-.3.25-.7.05-.7-.3z"
        fill="color-mix(in oklch, var(--ov-brand) 22%, transparent)"
        stroke="var(--ov-brand)"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <circle cx={7} cy={8} r={0.85} fill="var(--ov-brand)" />
      <circle cx={11} cy={8} r={0.85} fill="var(--ov-brand)" />
    </svg>
  );
}

export interface OverlayHeaderProps {
  onDismiss: () => void;
}

export function OverlayHeader({ onDismiss }: OverlayHeaderProps) {
  return (
    <header className="h-11 shrink-0 pl-3 pr-2 flex items-center justify-between border-b border-(--ov-border)">
      <div className="flex items-center gap-2 min-w-0">
        <GhostIcon className="w-[18px] h-[18px] shrink-0" />
        <span className="text-[13px] font-semibold tracking-tight text-(--ov-ink) truncate">
          Ghost Job Detector
        </span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss Ghost Job Detector overlay"
        className="w-8 h-8 grid place-items-center rounded-md text-(--ov-ink-muted) hover:bg-(--ov-surface) hover:text-(--ov-ink) transition-colors focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#7c5cff66]"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </header>
  );
}
