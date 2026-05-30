/**
 * Landing page (/) — single long-scroll experience per CONTEXT D-62.
 *
 * Section order: Hero (with embedded DemoSection client island holding the
 * single ScoreDial + 4 band buttons) → Problem → How it works → InstallCTA
 * → LandingFooter. The "demo" block from CONTEXT D-62's 6-section list is
 * functionally part of the Hero subtree because UI-SPEC line 256 mandates
 * ONE ScoreDial on the page; DemoSection is embedded inside <Hero /> rather
 * than rendered as a sibling.
 *
 * Server component — every section is a server component except DemoSection
 * which Hero embeds as a client island (Next.js boundary). No 'use client'
 * needed here; Next.js handles the client-island serialization automatically.
 *
 * Plan 05-05 fully replaces the Phase-1 placeholder import. The placeholder
 * component file remains on disk but is no longer referenced; future cleanup
 * can delete it.
 */

import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { InstallCTA } from '@/components/landing/InstallCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

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
