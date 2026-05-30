/**
 * LandingFooter (landing) — quiet outro row.
 *
 * UI-SPEC §"Footer (landing page only)" lines 268-274.
 *
 * Two-element row: brand chip on the left (reuses the same brand-dot + name
 * motif as the topbar — visual continuity end-to-end), trust line on the
 * right as mono-uppercase. Replaces the single muted blob with a real footer
 * that anchors the brand.
 *
 * Phase 5 omits the right-side "Privacy →" link target because the Settings
 * drawer state lives in AppShell (not URL-driven) and adding a click handler
 * would force this footer into a client boundary just for a low-traffic link.
 * Phase 8 polish may wire the Privacy link if useful.
 */

function GhostLogo() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="text-[--color-brand] shrink-0">
      <path
        d="M12 2C7.03 2 3 6.03 3 11v11l3-2.25 3 2.25 3-2.25 3 2.25 3-2.25 3 2.25V11C21 6.03 16.97 2 12 2z"
        fill="currentColor"
      />
      <circle cx="9" cy="11" r="1.5" fill="white" />
      <circle cx="15" cy="11" r="1.5" fill="white" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-[--color-surface-subtle] border-t border-[--color-border] py-10 md:py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <p className="flex items-center gap-2 text-sm font-medium text-[--color-ink]">
          <GhostLogo />
          Ghost Job Detector
        </p>
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
          BYOK · No accounts · No tracking
        </p>
      </div>
    </footer>
  );
}
