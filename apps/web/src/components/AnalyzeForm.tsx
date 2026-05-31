'use client';

import type { AnalyzeRequest } from '@ghost/shared';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { analyzeApi } from '@/lib/analyzeApi';
import { pushHistory } from '@/lib/storage';
import { AnalyzeResult, type AnalyzeResultState } from './AnalyzeResult';

const EASE = [0.22, 1, 0.36, 1] as const;

type SaveState = { kind: 'idle' } | { kind: 'saved' } | { kind: 'duplicate' };

const headerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function AnalyzeForm() {
  const reduced = useReducedMotion();
  const [description, setDescription] = useState('');
  const [resultState, setResultState] = useState<AnalyzeResultState>({
    kind: 'idle',
  });
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [lastSavedHash, setLastSavedHash] = useState<{ hash: string; ts: number } | null>(null);

  const trimmed = description.trim();
  const isTooShort = trimmed.length < 20;
  const isTooLong = description.length > 50_000;
  const submitDisabled = isTooShort || isTooLong || resultState.kind === 'loading';

  const handleSubmit = async (): Promise<void> => {
    if (isTooShort) {
      setResultState({ kind: 'idle' });
      return;
    }
    if (isTooLong) return;
    setResultState({ kind: 'loading' });
    setSaveState({ kind: 'idle' });
    const request: AnalyzeRequest = {
      title: '(pasted-textarea)',
      company: '',
      location: '',
      description: trimmed,
    };
    try {
      const response = await analyzeApi(request);
      setResultState({ kind: 'success', posting: request, response });
    } catch {
      setResultState({ kind: 'error_unknown' });
    }
  };

  const handleSave = (): void => {
    if (resultState.kind !== 'success') return;
    const { posting, response } = resultState;
    const hash = `${response.score}-${response.risk}-${posting.title.slice(0, 30)}`;
    const now = Date.now();
    if (lastSavedHash !== null && lastSavedHash.hash === hash && now - lastSavedHash.ts < 5000) {
      setSaveState({ kind: 'duplicate' });
      setTimeout(() => setSaveState({ kind: 'idle' }), 3000);
      return;
    }
    const id = now.toString(36) + Math.random().toString(36).slice(2, 9);
    const entry = { id, timestamp: now, posting, response };
    pushHistory(entry);
    setLastSavedHash({ hash, ts: now });
    setSaveState({ kind: 'saved' });
    setTimeout(() => setSaveState({ kind: 'idle' }), 3000);
  };

  const handleRetry = (): void => {
    setResultState({ kind: 'idle' });
  };

  const saveLabel =
    saveState.kind === 'saved'
      ? 'Saved to dashboard'
      : saveState.kind === 'duplicate'
        ? 'Already saved'
        : 'Save to dashboard';
  const saveDisabled = saveState.kind !== 'idle';

  return (
    <div className="relative max-w-[1180px] mx-auto py-10 md:py-16 px-4 md:px-6 lg:px-8">
      <motion.header
        variants={headerVariants}
        initial={reduced ? false : 'hidden'}
        animate="visible"
        className="flex flex-col gap-3 mb-10 md:mb-14 max-w-[680px]"
      >
        <motion.p
          variants={fadeUp}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[--color-brand]" strokeWidth={2} />
          Analyzer
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[--color-ink] tracking-[-0.025em] leading-[1.05]"
        >
          Score a posting<span className="text-[--color-brand]">.</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-base md:text-lg text-[--color-ink-muted] leading-[1.5]"
        >
          Paste a job posting below. We'll score it the same way the extension does, same engine,
          same signals.
        </motion.p>
      </motion.header>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="gjd-analyze-textarea">Job posting</Label>
            <span
              className={[
                'text-xs font-mono tabular-nums',
                isTooLong
                  ? 'text-[--color-risk-ghost-fg]'
                  : description.length > 49_000
                    ? 'text-[--color-ink]'
                    : 'text-[--color-ink-muted]',
              ].join(' ')}
            >
              {description.length.toLocaleString()}
              <span className="text-[--color-ink-subtle]"> / 50,000</span>
            </span>
          </div>

          <Textarea
            id="gjd-analyze-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the full posting — title, company, location, and the description. The more we get, the better we can score."
            className="min-h-[340px]"
            aria-describedby="gjd-analyze-helper"
            aria-invalid={isTooShort && description.length > 0 ? true : undefined}
          />

          {isTooShort && description.length > 0 ? (
            <p
              id="gjd-analyze-helper"
              className="text-xs leading-[1.5]"
              style={{ color: 'var(--color-risk-ghost-fg)' }}
            >
              That doesn't look like a full job description. Paste at least 20 characters and try
              again.
            </p>
          ) : isTooLong ? (
            <p
              id="gjd-analyze-helper"
              className="text-xs leading-[1.5]"
              style={{ color: 'var(--color-risk-ghost-fg)' }}
            >
              That posting is unusually long (max 50,000 characters). Trim it and try again.
            </p>
          ) : (
            <p id="gjd-analyze-helper" className="text-xs text-[--color-ink-muted] leading-[1.55]">
              Minimum 20 characters of description. Your posting is sent to
              ghost-job-detector.vercel.app for analysis. Your OpenAI key (if set in Settings) is
              sent in a header and never logged.
            </p>
          )}

          <Button
            onClick={() => void handleSubmit()}
            disabled={submitDisabled}
            variant="default"
            size="lg"
            className="self-start mt-3"
          >
            {resultState.kind === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Analyzing…
              </>
            ) : (
              <>
                Analyze posting
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </Button>
        </div>

        <div className="lg:w-[440px]">
          <AnalyzeResult
            state={resultState}
            onSave={handleSave}
            saveLabel={saveLabel}
            saveDisabled={saveDisabled}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  );
}
