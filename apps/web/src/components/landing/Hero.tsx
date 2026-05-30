'use client';

/**
 * Hero (landing) — Linear-inspired dark hero with aurora glow + spring motion.
 *
 * Now a client component because framer-motion runs in the client. The
 * single-ScoreDial invariant (UI-SPEC line 256) is still preserved — only
 * DemoSection mounts the dial, in its `compact` form.
 *
 * Aesthetic: dark surface, radial brand aurora behind the headline, gradient
 * hairline border on the demo panel, stagger-reveal of headline blocks via
 * framer-motion with an ease-out-quart curve. Hover/press states use spring
 * scale + brand-glow shadow.
 *
 * Reduced-motion is handled at two layers: framer-motion respects the
 * `useReducedMotion` hook, and globals.css force-disables transitions/animations
 * for users who set `prefers-reduced-motion: reduce`.
 */

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoSection } from '@/components/DemoSection';

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const demoVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE, delay: 0.25 },
  },
};

export function Hero() {
  const reduced = useReducedMotion();
  const initial = reduced ? 'visible' : 'hidden';

  return (
    <section className="aurora-bg relative bg-transparent pt-14 pb-20 md:pt-24 md:pb-28 px-4 md:px-6 lg:px-8 overflow-hidden">
      <motion.div
        className="max-w-[1180px] mx-auto grid md:grid-cols-[1.1fr_1fr] lg:grid-cols-[1.2fr_1fr] gap-10 md:gap-14 lg:gap-20 items-center"
        variants={containerVariants}
        initial={initial}
        animate="visible"
      >
        <div className="flex flex-col gap-5 md:gap-7">
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[--color-brand-glow] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[--color-brand]" />
            </span>
            <span className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
              <span className="text-[--color-ink]">Live</span>
              <span className="mx-2 text-[--color-ink-subtle]">·</span>
              For LinkedIn + Indeed
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-[--color-ink] tracking-[-0.025em] leading-[0.92]"
          >
            <span className="block text-4xl md:text-5xl lg:text-[3.75rem] font-semibold">
              Stop interviewing
            </span>
            <span className="block text-5xl md:text-6xl lg:text-7xl xl:text-[5.75rem] font-semibold mt-1 md:mt-2 bg-gradient-to-b from-[--color-ink] to-[oklch(0.78_0.005_260)] bg-clip-text text-transparent">
              ghost jobs.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-[--color-ink-muted] leading-[1.5] max-w-[540px]"
          >
            A trust score for every job posting on LinkedIn and Indeed, before
            you spend an hour writing a cover letter.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center mt-2"
          >
            <Button asChild size="lg" variant="default">
              <Link href="/install">
                Install the extension
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/analyze">
                Or try a paste-in
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-[--color-ink-subtle] mt-3"
          >
            <Check
              className="h-3.5 w-3.5 text-[--color-brand]"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            BYOK · No accounts · No tracking
          </motion.p>
        </div>

        <motion.div variants={demoVariants} className="relative md:pl-2 lg:pl-4">
          {/* Outer glow */}
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-[--color-brand-glow]/20 to-transparent blur-2xl pointer-events-none"
          />
          {/* Panel with gradient hairline */}
          <div className="relative ring-hairline rounded-xl bg-[--color-surface-elevated]/80 backdrop-blur-sm border border-[--color-border] p-6 md:p-7 shadow-[--shadow-elevation-2]">
            <DemoSection compact />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
