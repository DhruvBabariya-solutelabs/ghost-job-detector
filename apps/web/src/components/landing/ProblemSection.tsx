import { RISK_BANDS, RISK_COLORS } from '@ghost/shared';

export function ProblemSection() {
  return (
    <section className="bg-[--color-surface-subtle] py-16 md:py-24 px-4 md:px-6 lg:px-8">
      <div className="max-w-[860px] mx-auto flex flex-col gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
            The problem
          </p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-semibold text-[--color-ink] tracking-tight leading-[1.05]">
            What's a ghost job?
          </h2>
        </div>

        <p className="text-xl md:text-2xl lg:text-[1.7rem] text-[--color-ink] leading-[1.35] max-w-[720px] font-medium tracking-tight">
          A posting that looks real but isn't — no one's hiring, the description is filler, or
          worse, it's a scam.
        </p>

        <div className="flex flex-col gap-4 max-w-[680px]">
          <p className="text-base md:text-lg text-[--color-ink] leading-[1.65]">
            Ghost jobs come in three flavors: postings open for months with no real intent to hire,
            AI-generated filler designed to harvest resumes, and outright scams that ask you to
            message a recruiter on WhatsApp. The signals that give them away aren't always obvious —
            until you know what to look for.
          </p>
          <p className="text-base md:text-lg text-[--color-ink] leading-[1.65]">
            Ghost Job Detector reads the posting you're looking at, runs it through five trust
            signals, and shows you a score in under three seconds. You stay on the page. You skip
            the bad ones. You save the hour you'd have spent writing a cover letter into the void.
          </p>
        </div>

        <div className="pt-6 md:pt-8 border-t border-[--color-border] flex flex-col gap-3">
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
            The four risk bands
          </p>
          <div className="flex flex-wrap gap-2">
            {RISK_BANDS.map((b) => (
              <span
                key={b.key}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `color-mix(in oklch, ${RISK_COLORS[b.key]} 18%, transparent)`,
                  color: `var(--color-risk-${b.key}-fg)`,
                  boxShadow: `inset 0 0 0 1px ${RISK_COLORS[b.key]}40`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: RISK_COLORS[b.key] }}
                  aria-hidden="true"
                />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
