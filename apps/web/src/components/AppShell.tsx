'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { DRAWER_WIDTH_PX, SettingsDrawer } from './SettingsDrawer';
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
          paddingRight: 'var(--app-shell-shift, 0px)',
        }}
        data-drawer-open={drawerOpen || undefined}
      >
        {children}
      </div>
      <style>{`
        @media (min-width: 1280px) {
          [data-drawer-open="true"] {
            --app-shell-shift: ${DRAWER_WIDTH_PX}px;
          }
        }
      `}</style>
      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
