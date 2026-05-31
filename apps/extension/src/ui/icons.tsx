import type { ReactNode, SVGProps } from 'react';
import type { VerdictIconKey } from './verdict';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Glyph({ size = 16, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ShieldCheckIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Glyph>
  );
}

export function AlertTriangleIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M12 4.5l8 14H4l8-14z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Glyph>
  );
}

export function FlagIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M6 21V4" />
      <path d="M6 4h10l-1.5 3.5L16 11H6" />
    </Glyph>
  );
}

export function GhostIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M5 11a7 7 0 0 1 14 0v8l-2.3-1.6L14.4 19 12 17.3 9.6 19l-2.3-1.6L5 19z" />
      <path d="M9.5 10.5h.01" />
      <path d="M14.5 10.5h.01" />
    </Glyph>
  );
}

export function ShareIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="17" cy="6" r="2.4" />
      <circle cx="17" cy="18" r="2.4" />
      <path d="M8.1 10.9l6.8-3.6M8.1 13.1l6.8 3.6" />
    </Glyph>
  );
}

export function SettingsIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M4 8h8M16 8h4" />
      <circle cx="14" cy="8" r="2" />
      <path d="M4 16h4M12 16h8" />
      <circle cx="10" cy="16" r="2" />
    </Glyph>
  );
}

export function ExpandIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
    </Glyph>
  );
}

export function SunIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Glyph>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z" />
    </Glyph>
  );
}

export function RefreshIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M20 11a8 8 0 0 0-14-4.5L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14 4.5L20 16" />
      <path d="M20 20v-4h-4" />
    </Glyph>
  );
}

export function ScanIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16" />
    </Glyph>
  );
}

export function ChevronIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M9 6l6 6-6 6" />
    </Glyph>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Glyph>
  );
}

export function DownloadIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </Glyph>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M5 12.5l4.5 4.5L19 6.5" />
    </Glyph>
  );
}

export function WifiOffIcon(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M3 3l18 18" />
      <path d="M5 12.5a11 11 0 0 1 4-2.6M2 8.8A16 16 0 0 1 8 6M16 6a16 16 0 0 1 6 2.8M14.5 9.9a11 11 0 0 1 4.5 2.6" />
      <path d="M9 16.2a6 6 0 0 1 6 0" />
      <path d="M12 20h.01" />
    </Glyph>
  );
}

export function VerdictIcon({ iconKey, ...props }: IconProps & { iconKey: VerdictIconKey }) {
  switch (iconKey) {
    case 'shield':
      return <ShieldCheckIcon {...props} />;
    case 'alert':
      return <AlertTriangleIcon {...props} />;
    case 'flag':
      return <FlagIcon {...props} />;
    case 'ghost':
      return <GhostIcon {...props} />;
  }
}
