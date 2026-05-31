import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { InstallCTA } from '@/components/landing/InstallCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ProblemSection } from '@/components/landing/ProblemSection';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <InstallCTA />
      <LandingFooter />
    </main>
  );
}
