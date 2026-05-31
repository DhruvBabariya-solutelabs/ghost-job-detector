import type { SignalKey } from '@ghost/shared';
import { SIGNAL_LABELS } from '@/lib/labels';

const SIGNAL_WEIGHTS: Record<SignalKey, string> = {
  ai: '30',
  specificity: '25',
  buzzword: '20',
  scam: '15',
  llm: '10',
};

const SIGNAL_BODY: Record<SignalKey, string> = {
  ai: "Looks for the rhythm and word choice of GPT-style filler. Postings written by a hiring manager have texture; postings written by a chatbot don't.",
  specificity:
    'Checks whether the posting names a salary range, a tech stack, a team size, a reporting line. The absence of specifics is the loudest signal of all.',
  buzzword:
    'Counts how often the posting leans on rockstar / ninja / fast-paced / self-starter language. One or two is fine. Five is a tell.',
  scam: 'Flags urgency pressure, unrealistic comp claims, requests to message on WhatsApp or a personal email, and other patterns that show up in known job scams.',
  llm: "Sends the posting to an LLM for a structured second opinion on whether it reads as a real listing, with strict-output guardrails so the model can't be tricked by injection.",
};

const SIGNAL_ORDER: readonly SignalKey[] = [
  'ai',
  'specificity',
  'buzzword',
  'scam',
  'llm',
] as const;

export function HowItWorks() {
  return (
    <section className="bg-[--color-surface] py-16 md:py-24 px-4 md:px-6 lg:px-8">
      <div className="max-w-[960px] mx-auto">
        <div className="max-w-[640px] mb-12 md:mb-16">
          <p className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-[--color-ink-muted] mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[--color-ink] leading-[1.1] tracking-tight">
            Five signals. Weighted by impact.
          </h2>
          <p className="text-base md:text-lg text-[--color-ink-muted] leading-[1.55] mt-4">
            The score is the sum of how each one fires. Heavier signals carry more weight.
          </p>
        </div>

        <ol className="flex flex-col">
          {SIGNAL_ORDER.map((key, index) => (
            <li
              key={key}
              className="group grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_5rem_1fr] gap-x-5 md:gap-x-10 py-7 md:py-9 border-t border-[--color-border] first:border-t-0"
            >
              <div className="pt-1 font-mono tabular-nums text-xs md:text-sm text-[--color-ink-muted] tracking-wider">
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className="hidden md:flex items-baseline gap-1">
                <span className="font-mono tabular-nums text-3xl lg:text-4xl font-semibold text-[--color-brand] leading-none">
                  {SIGNAL_WEIGHTS[key]}
                </span>
                <span className="font-mono text-sm text-[--color-brand]/70 font-medium">%</span>
              </div>

              <div>
                <div className="flex items-baseline gap-3 mb-2 md:hidden">
                  <h3 className="text-lg font-semibold text-[--color-ink] tracking-tight">
                    {SIGNAL_LABELS[key]}
                  </h3>
                  <span className="font-mono tabular-nums text-sm text-[--color-brand] font-semibold">
                    {SIGNAL_WEIGHTS[key]}%
                  </span>
                </div>
                <h3 className="hidden md:block text-xl lg:text-2xl font-semibold text-[--color-ink] mb-3 tracking-tight">
                  {SIGNAL_LABELS[key]}
                </h3>
                <p className="text-base text-[--color-ink] leading-[1.6] max-w-[560px]">
                  {SIGNAL_BODY[key]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
