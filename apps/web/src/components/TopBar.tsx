'use client';

/**
 * TopBar — sticky 48px nav rendered on every Phase 5 route via AppShell.
 *
 * Spec: CONTEXT D-65 + UI-SPEC §"TopBar" lines 415-443.
 *
 * Anatomy:
 *   [● Ghost Job Detector]                 Analyze · Dashboard · Install · ⚙
 *      brand chip (Link → /)               nav links + gear button
 *
 * Active-route logic (UI-SPEC line 439-443):
 *   usePathname() === href ? active : idle.
 *   Active is rendered as a 2px brand-bottom-border at 8px length under the
 *   link text via the ::after pseudo-element + aria-current="page".
 *   Landing /  matches NO nav href → no underline on / (correct behavior;
 *   the brand chip is the home target).
 *
 * Security gates (verified by grep):
 *   - No console output of any level (T-05-16).
 *   - No lucide-react import — gear glyph is inline SVG (UI-SPEC line 31).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export interface TopBarProps {
  onOpenSettings: () => void;
}

export function TopBar({ onOpenSettings }: TopBarProps) {
  return (
    <header className="sticky top-0 z-[100] h-12 bg-[--color-surface]/70 backdrop-blur-xl border-b border-[--color-border]">
      <nav className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link
          href="/"
          aria-label="Ghost Job Detector — home"
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)] rounded-sm px-1"
        >
          <GhostLogo />
          <span className="text-sm font-medium text-[--color-ink]">
            Ghost Job Detector
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          <NavLink href="/analyze">Analyze</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/install">Install</NavLink>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="w-8 h-8 grid place-items-center rounded-sm hover:bg-[--color-surface-subtle] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
          >
            <GearIcon />
          </button>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'text-sm font-medium hover:text-[--color-brand]',
        'transition-colors duration-150',
        "relative focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)] rounded-sm px-1",
        "after:content-[''] after:block after:h-[2px] after:w-5 after:rounded-full after:mx-auto after:mt-1",
        isActive
          ? 'text-[--color-brand] after:bg-[--color-brand]'
          : 'text-[--color-ink] after:bg-transparent',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function GhostLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      className="text-[--color-brand] shrink-0"
    >
      <path
        d="M12 2C7.03 2 3 6.03 3 11v11l3-2.25 3 2.25 3-2.25 3 2.25 3-2.25 3 2.25V11C21 6.03 16.97 2 12 2z"
        fill="currentColor"
      />
      <circle cx="9" cy="11" r="1.5" fill="white" />
      <circle cx="15" cy="11" r="1.5" fill="white" />
    </svg>
  );
}

// Inline gear glyph — UI-SPEC line 31 forbids lucide-react. Static JSX, no
// dangerouslySetInnerHTML, so React's escaping defends against any XSS attempt
// even though this is author-controlled (T-04-54 mitigation pattern).
function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-[18px] h-[18px] text-[--color-ink]"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
