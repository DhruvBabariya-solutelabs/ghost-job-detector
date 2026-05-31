'use client';

import type { RiskBand } from '@ghost/shared';
import { RISK_COLORS } from '@ghost/shared';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { AlertTriangle, ArrowRight, ChevronRight, FileSearch } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { relativeTime } from '@/lib/relativeTime';
import type { HistoryEntry } from '@/lib/storage';
import { clearHistory, getHistory, removeHistoryById } from '@/lib/storage';
import { DashboardModal } from './DashboardModal';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; entries: HistoryEntry[] }
  | { kind: 'corrupted' }
  | { kind: 'unavailable' };

const SHORT_LABEL: Record<RiskBand, string> = {
  legitimate: 'Legitimate',
  caution: 'Caution',
  suspicious: 'Suspicious',
  ghost: 'Likely ghost',
};

const EASE = [0.22, 1, 0.36, 1] as const;

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

export function Dashboard() {
  const reduced = useReducedMotion();
  const [loadState, setLoadState] = useState<LoadState>({ kind: 'loading' });
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  useEffect(() => {
    const result = getHistory();
    const t = setTimeout(() => {
      if (result.kind === 'ok') {
        setLoadState({ kind: 'ok', entries: result.entries });
      } else if (result.kind === 'corrupted') {
        setLoadState({ kind: 'corrupted' });
      } else {
        setLoadState({ kind: 'unavailable' });
      }
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const handleDelete = useCallback((id: string): void => {
    removeHistoryById(id);
    setLoadState((prev) => {
      if (prev.kind !== 'ok') return prev;
      return { kind: 'ok', entries: prev.entries.filter((e) => e.id !== id) };
    });
    setOpenEntryId(null);
  }, []);

  const handleClearCorrupted = useCallback((): void => {
    clearHistory();
    setLoadState({ kind: 'ok', entries: [] });
  }, []);

  const openEntry =
    loadState.kind === 'ok' ? (loadState.entries.find((e) => e.id === openEntryId) ?? null) : null;

  const entriesCount = loadState.kind === 'ok' ? loadState.entries.length : 0;

  const headlineText =
    loadState.kind === 'loading'
      ? 'Your analyses'
      : loadState.kind === 'ok' && entriesCount > 0
        ? 'Recently scored'
        : 'Nothing yet';

  return (
    <div className="relative max-w-[1180px] mx-auto py-10 md:py-16 px-4 md:px-6 lg:px-8">
      <motion.header
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col gap-3 mb-10 md:mb-14"
      >
        <p className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
          Dashboard
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[--color-ink] tracking-[-0.025em] leading-[1.05]">
            {headlineText}
            <span className="text-[--color-brand]">.</span>
          </h1>
          {loadState.kind === 'ok' && entriesCount > 0 && (
            <p className="font-mono tabular-nums text-sm text-[--color-ink-muted] flex items-center gap-1.5">
              <span className="text-[--color-ink]">{entriesCount}</span>
              <span className="text-[--color-ink-subtle]">/</span>
              <span>50 saved</span>
            </p>
          )}
        </div>
        {loadState.kind === 'ok' && entriesCount > 0 && (
          <p className="text-base text-[--color-ink-muted] max-w-[640px]">
            Saved on this device. Click any row to see the full breakdown.
          </p>
        )}
      </motion.header>

      {loadState.kind === 'loading' && (
        <div className="flex flex-col" role="status" aria-live="polite" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[88px] border-t border-[--color-border] relative overflow-hidden"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[--color-surface-subtle]/60 to-transparent animate-[shimmer_1.8s_infinite] bg-[length:200%_100%]" />
            </div>
          ))}
        </div>
      )}

      {loadState.kind === 'corrupted' && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col gap-4 py-6 max-w-md"
        >
          <p
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em]"
            style={{ color: 'var(--color-risk-ghost-fg)' }}
          >
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} />
            Read error
          </p>
          <p className="text-lg text-[--color-ink] leading-[1.5]">
            Couldn't read your saved analyses. The local data looks corrupted.
          </p>
          <p className="text-sm text-[--color-ink-muted] leading-[1.55]">
            Clear it and start fresh. Nothing leaves this device.
          </p>
          <Button onClick={handleClearCorrupted} variant="solid" className="self-start">
            Clear and reset
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Button>
        </motion.div>
      )}

      {loadState.kind === 'unavailable' && (
        <div className="py-6 max-w-md">
          <p className="text-base text-[--color-ink-muted] leading-[1.55]">
            Local storage isn't available in this browser, so saved analyses can't be loaded here.
          </p>
        </div>
      )}

      {loadState.kind === 'ok' && entriesCount === 0 && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-col gap-6 py-4 max-w-xl"
        >
          <div className="w-14 h-14 rounded-full bg-[--color-surface-subtle] border border-[--color-border] grid place-items-center text-[--color-ink-muted]">
            <FileSearch className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="text-lg text-[--color-ink] leading-[1.55]">
            When you score a posting, it lands here. Up to 50 stay saved; the oldest drops off
            first.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            <Button asChild variant="default" size="default">
              <Link href="/analyze">
                Open the analyzer
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="default">
              <Link href="/#demo">
                Or see the landing demo
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </motion.div>
      )}

      {loadState.kind === 'ok' && entriesCount > 0 && (
        <motion.ul
          variants={listVariants}
          initial={reduced ? false : 'hidden'}
          animate="visible"
          className="flex flex-col"
        >
          {loadState.entries.map((entry) => {
            const { score, risk } = entry.response;
            const riskColor = RISK_COLORS[risk];
            const fg = `var(--color-risk-${risk}-fg)`;
            return (
              <motion.li key={entry.id} variants={rowVariants}>
                <button
                  type="button"
                  onClick={() => setOpenEntryId(entry.id)}
                  aria-label={`${entry.posting.title || 'Untitled posting'} — ${SHORT_LABEL[risk]} (score ${score})`}
                  className="group relative w-full text-left grid grid-cols-[5rem_1fr_auto] grid-rows-[auto_auto] md:grid-cols-[6.5rem_1fr_9rem_2rem] md:grid-rows-1 items-start md:items-center gap-x-4 gap-y-2 md:gap-x-6 md:gap-y-0 py-5 md:py-6 px-3 -mx-3 border-t border-[--color-border] hover:bg-[--color-surface-subtle]/60 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[--color-border-focus]/40 rounded-lg"
                >
                  <div className="row-span-2 md:row-span-1 flex items-baseline gap-1 self-center">
                    <span
                      className="font-mono tabular-nums text-4xl md:text-5xl font-semibold leading-none transition-[text-shadow] duration-300"
                      style={{
                        color: fg,
                        textShadow: `0 0 0 transparent`,
                      }}
                    >
                      {score}
                    </span>
                    <span className="font-mono text-xs text-[--color-ink-subtle] font-medium">
                      /100
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-base md:text-lg font-semibold text-[--color-ink] truncate group-hover:text-[--color-brand] transition-colors duration-200 tracking-tight">
                      {entry.posting.title || 'Untitled posting'}
                    </p>
                    <p className="text-sm text-[--color-ink-muted] truncate mt-0.5">
                      {entry.posting.company || 'No company'}
                      {' · '}
                      {entry.posting.location || 'No location'}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col md:items-end gap-2 md:gap-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${riskColor} 18%, transparent)`,
                        color: fg,
                        boxShadow: `inset 0 0 0 1px ${riskColor}40`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: riskColor }}
                        aria-hidden="true"
                      />
                      {SHORT_LABEL[risk]}
                    </span>
                    <span className="text-xs text-[--color-ink-muted] whitespace-nowrap font-mono tabular-nums">
                      {relativeTime(entry.timestamp)}
                    </span>
                  </div>

                  <ChevronRight
                    className="hidden md:block h-4 w-4 text-[--color-ink-subtle] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                    aria-hidden="true"
                  />
                </button>
              </motion.li>
            );
          })}
          <li aria-hidden="true" className="border-t border-[--color-border]" />
        </motion.ul>
      )}

      {openEntry && (
        <DashboardModal
          entry={openEntry}
          onClose={() => setOpenEntryId(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
