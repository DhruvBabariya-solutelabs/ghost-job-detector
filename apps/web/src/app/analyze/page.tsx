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
