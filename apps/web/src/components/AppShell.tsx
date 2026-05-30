'use client';

/**
 * AppShell — drawer state + page-shift coordination.
 *
 * When the settings drawer opens on desktop (≥lg / 1024px), the page content
 * shifts left by the drawer width (pushing sidebar pattern, à la Linear /
 * Notion) so the drawer doesn't overlay the page. On mobile, the drawer is
 * still a bottom sheet with a backdrop — pushing doesn't work on small screens.
 *
 * Drawer width is the single source of truth here (`DRAWER_WIDTH_PX`); both
 * AppShell's content-shift padding and SettingsDrawer's fixed width consume it.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { SettingsDrawer, DRAWER_WIDTH_PX } from './SettingsDrawer';
import { TopBar } from './TopBar';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <TopBar onOpenSettings={() => setDrawerOpen(true)} />
      <div
        className="transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          // Desktop (≥1024px): push content left by drawer width when open.
          // Below 1024px the drawer is a bottom-sheet modal — no shift needed.
          paddingRight: 'var(--app-shell-shift, 0px)',
        }}
        data-drawer-open={drawerOpen || undefined}
      >
        {children}
      </div>
      {/* Inline style block — sets the shift var only at ≥1024px so smaller
          breakpoints stay full-bleed (bottom-sheet modal) without media-query
          gymnastics in Tailwind. */}
      <style>{`
        @media (min-width: 1280px) {
          [data-drawer-open="true"] {
            --app-shell-shift: ${DRAWER_WIDTH_PX}px;
          }
        }
      `}</style>
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
