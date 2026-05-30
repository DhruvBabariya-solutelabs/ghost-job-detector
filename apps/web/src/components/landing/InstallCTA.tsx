/**
 * InstallCTA (landing) — closing CTA block before the footer.
 *
 * UI-SPEC §"Landing page — Install CTA section" lines 258-266 + §Copywriting
 * lines 260-264 (verbatim).
 *
 * Layout deviates from UI-SPEC centered-stack: editorial poster — eyebrow,
 * oversize headline, sub, dark CTA, all left-aligned. The closing block reads
 * as a final punch instead of a generic "centered hero-lite".
 */

import Link from 'next/link';

export function InstallCTA() {
  return (
    <section className="bg-[--color-surface] py-20 md:py-28 lg:py-32 px-4 md:px-6 lg:px-8 border-t border-[--color-border]">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-6 md:gap-8">
        <p className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
          Last thing
        </p>
        <h2 className="text-4xl md:text-6xl lg:text-7xl xl:text-[5.25rem] font-semibold text-[--color-ink] tracking-tight leading-[0.98] max-w-[920px]">
          Want it on every LinkedIn job you visit?
        </h2>
        <p className="text-lg md:text-xl text-[--color-ink-muted] leading-[1.45] max-w-[620px]">
          Install the unpacked extension in two minutes. We'll show you how.
        </p>
        <div className="mt-2">
          <Link
            href="/install"
            className="group inline-flex items-center gap-2 h-12 px-6 bg-[--color-ink] text-[--color-surface] text-sm font-semibold rounded-md hover:bg-[--color-brand] active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
          >
            View install instructions
            <span
              aria-hidden="true"
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
