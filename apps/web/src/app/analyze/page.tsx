/**
 * /analyze route — server component wrapping the client-side AnalyzeForm.
 *
 * Plan 05-06 / Task 3. Pattern matches apps/web/src/app/page.tsx (the
 * landing page) — a minimal `<main>` landmark wraps a single client island
 * which owns all of the interactive state.
 *
 * Page-level metadata.title overrides the root layout title for this
 * route (Next.js App Router convention) — gives the /analyze tab its own
 * browser tab name without forcing a custom <head>.
 */

import { AnalyzeForm } from '@/components/AnalyzeForm';

export const metadata = {
  title: 'Analyze a job posting · Ghost Job Detector',
};

export default function AnalyzePage() {
  return (
    <main>
      <AnalyzeForm />
    </main>
  );
}
