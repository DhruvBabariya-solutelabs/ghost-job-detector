'use client';

import type { AnalyzeResponse, JobPosting, RiskBand } from '@ghost/shared';
import { RISK_BANDS } from '@ghost/shared';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { AlertTriangle, ArrowRight, BookOpen, Check, Loader2, RefreshCw } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ReasonsList } from './ReasonsList';
import { RiskLabel } from './RiskLabel';
import { ScoreDial } from './ScoreDial';
import { SignalBreakdownDrawer } from './SignalBreakdownDrawer';

const EASE = [0.22, 1, 0.36, 1] as const;

const panelVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: EASE } },
};

export type AnalyzeResultState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; posting: JobPosting; response: AnalyzeResponse }
  | { kind: 'error_network' }
  | { kind: 'error_unknown' };

export interface AnalyzeResultProps {
  state: AnalyzeResultState;
  onSave: () => void;
  saveLabel: string;
  saveDisabled: boolean;
  onRetry: () => void;
}

function labelFor(band: RiskBand): string {
  for (const b of RISK_BANDS) {
    if (b.key === band) return b.label;
  }
  return 'Unknown';
}

export function AnalyzeResult({
  state,
  onSave,
  saveLabel,
  saveDisabled,
  onRetry,
}: AnalyzeResultProps) {
  const reduced = useReducedMotion();
  const drawerId = useId();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-2 rounded-2xl bg-gradient-to-b from-[--color-brand-glow]/10 to-transparent blur-2xl pointer-events-none"
      />
      <div className="relative ring-hairline rounded-xl bg-[--color-surface-elevated]/80 backdrop-blur-sm border border-[--color-border] p-5 md:p-6 min-h-[460px] flex flex-col">
        <AnimatePresence mode="wait">
          {state.kind === 'idle' && (
            <motion.div
              key="idle"
              variants={panelVariants}
              initial={reduced ? false : 'initial'}
              animate="enter"
              exit="exit"
              className="flex flex-col items-center justify-center gap-4 text-center flex-1 py-8"
            >
              <p className="absolute top-5 left-5 text-xs font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
                Result
              </p>
              <div className="relative w-16 h-16 rounded-full bg-[--color-surface-subtle] border border-[--color-border] grid place-items-center text-[--color-ink-muted]">
                <BookOpen className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[--color-ink-muted] max-w-[300px] leading-[1.55]">
                Your trust score and signal breakdown will appear here once you analyze a posting.
              </p>
            </motion.div>
          )}

          {state.kind === 'loading' && (
            <motion.div
              key="loading"
              variants={panelVariants}
              initial={reduced ? false : 'initial'}
              animate="enter"
              exit="exit"
              className="flex flex-col items-center gap-4 flex-1"
            >
              <p className="absolute top-5 left-5 text-xs font-mono uppercase tracking-[0.18em] text-[--color-brand]">
                Scoring
              </p>
              <div className="h-6" />
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full bg-[--color-surface-subtle] animate-pulse" />
                <Loader2
                  className="absolute inset-0 m-auto h-8 w-8 text-[--color-brand] animate-spin"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
              <p className="text-lg font-semibold text-[--color-ink] tracking-tight">
                Analyzing
                <span className="inline-flex ml-1 gap-0.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-[--color-ink] animate-[pulse_1s_ease-in-out_infinite]" />
                  <span className="inline-block w-1 h-1 rounded-full bg-[--color-ink] animate-[pulse_1s_ease-in-out_infinite_0.2s]" />
                  <span className="inline-block w-1 h-1 rounded-full bg-[--color-ink] animate-[pulse_1s_ease-in-out_infinite_0.4s]" />
                </span>
              </p>
              <div className="w-full space-y-2 mt-2" aria-hidden="true">
                <div
                  className="h-3 bg-[--color-surface-subtle] rounded-sm animate-pulse"
                  style={{ width: '100%' }}
                />
                <div
                  className="h-3 bg-[--color-surface-subtle] rounded-sm animate-pulse"
                  style={{ width: '80%' }}
                />
                <div
                  className="h-3 bg-[--color-surface-subtle] rounded-sm animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>
              <span className="sr-only" aria-live="polite">
                Analyzing your job posting…
              </span>
            </motion.div>
          )}

          {state.kind === 'success' && (
            <motion.div
              key="success"
              variants={panelVariants}
              initial={reduced ? false : 'initial'}
              animate="enter"
              exit="exit"
              className="flex flex-col items-center gap-4 flex-1"
            >
              <div className="w-full flex items-baseline justify-between mb-1">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[--color-brand]">
                  Result
                </p>
                <p className="text-xs font-mono tabular-nums text-[--color-ink-muted]">
                  {state.response.score}/100
                </p>
              </div>
              <ScoreDial
                score={state.response.score}
                risk={state.response.risk}
                size={128}
                drawerOpen={drawerOpen}
                onToggleDrawer={() => setDrawerOpen((prev) => !prev)}
                drawerId={drawerId}
              />
              <RiskLabel band={state.response.risk} />
              <p className="text-sm text-[--color-ink-muted]">{labelFor(state.response.risk)}</p>
              <span className="sr-only" aria-live="polite">
                Trust score: {state.response.score} out of 100. Verdict:{' '}
                {labelFor(state.response.risk)}.
              </span>
              <div className="w-full">
                <ReasonsList reasons={state.response.reasons} />
              </div>
              <SignalBreakdownDrawer
                breakdown={state.response.signalBreakdown}
                open={drawerOpen}
                band={state.response.risk}
                drawerId={drawerId}
              />
              <Button
                onClick={onSave}
                disabled={saveDisabled}
                variant={saveDisabled ? 'secondary' : 'default'}
                className="w-full mt-3"
              >
                {saveLabel === 'Saved to dashboard' && (
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                )}
                {saveLabel}
                {!saveDisabled && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </motion.div>
          )}

          {(state.kind === 'error_network' || state.kind === 'error_unknown') && (
            <motion.div
              key="error"
              variants={panelVariants}
              initial={reduced ? false : 'initial'}
              animate="enter"
              exit="exit"
              className="flex flex-col items-center justify-center gap-4 text-center flex-1 py-8"
            >
              <p
                className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.18em]"
                style={{ color: 'var(--color-risk-ghost-fg)' }}
              >
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} />
                Error
              </p>
              <div
                className="w-14 h-14 rounded-full grid place-items-center"
                style={{
                  backgroundColor: 'color-mix(in oklch, #dc2626 18%, transparent)',
                  color: 'var(--color-risk-ghost-fg)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in oklch, #dc2626 35%, transparent)',
                }}
              >
                <AlertTriangle className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-[--color-ink] tracking-tight">
                We couldn't analyze this posting.
              </h3>
              <p className="text-sm text-[--color-ink-muted] leading-[1.55] max-w-[300px]">
                {state.kind === 'error_network'
                  ? "We couldn't reach the server. Check your connection and try again."
                  : 'Something went wrong. Try again, and if the problem persists, paste a different posting.'}
              </p>
              <Button onClick={onRetry} variant="solid" className="mt-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
