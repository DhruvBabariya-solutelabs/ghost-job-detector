interface Step {
  n: number;
  heading: string;
  body: string;
  code?: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    heading: 'Unzip to a permanent folder',
    body: "After downloading, extract extension.zip to a folder you won't move or delete — Chrome loads the extension directly from that folder. On Windows: right-click → \"Extract All\". On Mac: double-click the zip.",
  },
  {
    n: 2,
    heading: 'Enable Developer mode in Chrome',
    body: 'Paste the address below into Chrome\'s address bar and press Enter. Then toggle the "Developer mode" switch in the top-right corner. A new button row will appear.',
    code: 'chrome://extensions',
  },
  {
    n: 3,
    heading: 'Click "Load unpacked" and select the folder',
    body: 'Click the "Load unpacked" button that appeared. Navigate to the folder you extracted in step 1 and select it. The Ghost Job Detector card should appear immediately.',
  },
  {
    n: 4,
    heading: 'Add your OpenRouter API key',
    body: 'Click the Ghost Job Detector icon in your toolbar (or go to the extension card → Details → Extension options). Paste your OpenRouter API key and click Save. The key never leaves your browser.',
    code: 'openrouter.ai/keys',
  },
  {
    n: 5,
    heading: 'Pin the extension to your toolbar',
    body: 'Click the puzzle-piece icon in Chrome\'s toolbar, find Ghost Job Detector, and click the pin icon. Now it\'s one click away on any LinkedIn or Indeed job page.',
  },
];

export function InstallPage() {
  return (
    <div className="max-w-[920px] mx-auto py-10 md:py-16 px-4 md:px-6 lg:px-8">

      {/* Header */}
      <header className="flex flex-col gap-3 mb-10 md:mb-12 max-w-[680px]">
        <p className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
          Setup
        </p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[--color-ink] tracking-tight leading-[1.05]">
          Install the extension.
        </h1>
        <p className="text-base md:text-lg text-[--color-ink-muted] leading-[1.5]">
          Download the pre-built zip, load it in Chrome, add your API key.
          Under two minutes — no Chrome Web Store needed.
        </p>
      </header>

      {/* Download card */}
      <div
        className="mb-12 md:mb-16 p-6 md:p-8 rounded-xl border border-[--color-border] max-w-[720px]"
        style={{ background: 'color-mix(in oklch, var(--color-brand) 6%, var(--color-surface))' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 flex flex-col gap-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-[--color-ink-muted]">
              Step 0 — Get the zip
            </p>
            <p className="text-xl md:text-2xl font-semibold text-[--color-ink] tracking-tight">
              Download the extension
            </p>
            <p className="text-sm text-[--color-ink-muted] leading-[1.5]">
              Pre-built MV3 · Chrome &amp; Edge · No source required
            </p>
          </div>
          <a
            href="/extension.zip"
            download="ghost-job-detector-extension.zip"
            className="inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-lg text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 active:scale-[0.98] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)] whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            <DownloadIcon />
            Download .zip
          </a>
        </div>

        {/* Manual build fallback */}
        <p className="mt-5 pt-5 border-t border-[--color-border] text-xs text-[--color-ink-muted] leading-[1.6]">
          <span className="font-semibold text-[--color-ink]">Prefer to build from source?</span>
          {' '}Run{' '}
          <code className="px-1.5 py-0.5 rounded bg-[--color-surface-subtle] border border-[--color-border] font-mono text-[0.8em]">
            npm run build --workspace=@ghost/extension
          </code>
          {' '}then{' '}
          <code className="px-1.5 py-0.5 rounded bg-[--color-surface-subtle] border border-[--color-border] font-mono text-[0.8em]">
            npm run zip --workspace=@ghost/extension
          </code>
          {' '}from the repo root. The zip lands in{' '}
          <code className="px-1.5 py-0.5 rounded bg-[--color-surface-subtle] border border-[--color-border] font-mono text-[0.8em]">
            apps/extension/.output/
          </code>.
        </p>
      </div>

      {/* Steps */}
      <ol className="flex flex-col">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr] gap-x-5 md:gap-x-10 py-8 md:py-10 border-t border-[--color-border]"
          >
            <div className="pt-1.5 flex items-baseline">
              <span
                className="grid place-items-center w-9 h-9 md:w-10 md:h-10 rounded-full font-mono tabular-nums text-sm font-semibold"
                style={{
                  backgroundColor: 'color-mix(in oklch, var(--color-brand) 18%, transparent)',
                  color: 'var(--color-brand-strong)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--color-brand) 40%, transparent)',
                }}
              >
                {step.n}
              </span>
            </div>
            <div className="flex flex-col gap-3 max-w-[640px]">
              <h2 className="text-xl md:text-2xl font-semibold text-[--color-ink] tracking-tight leading-[1.2]">
                {step.heading}
              </h2>
              <p className="text-base text-[--color-ink] leading-[1.65]">
                {step.body}
              </p>
              {step.code !== undefined && (
                <div className="inline-flex items-center gap-2 w-fit mt-1">
                  <code
                    className="px-3 py-1.5 rounded-md text-sm font-mono text-[--color-brand] border border-[--color-border]"
                    style={{ background: 'color-mix(in oklch, var(--color-brand) 8%, var(--color-surface))' }}
                  >
                    {step.code}
                  </code>
                  {step.n === 2 && (
                    <span className="text-xs text-[--color-ink-muted]">← paste this in the address bar</span>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Why sideload aside */}
      <aside className="mt-16 md:mt-20 p-6 md:p-8 bg-[--color-surface-subtle] border border-[--color-border] rounded-lg max-w-[720px]">
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-[--color-ink-muted] mb-2">
          Aside
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold text-[--color-ink] tracking-tight leading-[1.15]">
          Why sideload?
        </h2>
        <p className="text-base text-[--color-ink] leading-[1.65] mt-3">
          Chrome Web Store review takes one to three days. We built this in
          three days. The math doesn't math. Sideloading takes two minutes and
          works exactly the same — once your key is in the Options page,
          the overlay is fully functional on LinkedIn and Indeed.
        </p>
      </aside>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 3v9m0 0-3-3m3 3 3-3" />
      <path d="M3 14v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
    </svg>
  );
}
