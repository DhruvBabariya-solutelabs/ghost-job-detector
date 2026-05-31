import type { JobPosting } from '@ghost/shared';

export interface NonPostingPassingGateFixture {
  id: string;
  posting: JobPosting;
  expectedLlmIsJobPosting: false;
  expectedLeadingReasonText: string;
}

const DOMINANT_NEGATIVE_TEXT = "This doesn't look like a job posting - score may not be meaningful";

export const NON_POSTING_PASSING_GATE_FIXTURES: NonPostingPassingGateFixture[] = [
  {
    id: 'resume-with-engineer-4x',
    posting: {
      title: 'x',
      company: '',
      location: '',
      description:
        'Jordan Kim — Software Engineer\n\n' +
        'Summary: Experienced software engineer with 7 years of expertise in building ' +
        'distributed backend systems. Previously a software engineer at two Series-B startups ' +
        'and one Fortune 500 company. Seeking new opportunities in infrastructure engineering.\n\n' +
        'Skills: Python, Go, TypeScript, PostgreSQL, Redis, Kafka, Kubernetes, AWS, Terraform\n\n' +
        'Experience:\n\n' +
        '2022-2025: Senior Software Engineer — DataStream Inc., Seattle WA\n' +
        '  Built and maintained real-time data ingestion pipelines handling 2B events/day.\n' +
        '  Led migration of 40 microservices from on-prem to AWS EKS cluster.\n' +
        '  Reduced p99 API latency from 450ms to 80ms via query optimization.\n' +
        '  Mentored 4 junior engineers on distributed systems design patterns.\n\n' +
        '2019-2022: Software Engineer — Meridian Payments, San Francisco CA\n' +
        '  Developed payment processing APIs serving 500k monthly active users.\n' +
        '  Owned on-call rotation for critical payment services (1 week in 8).\n' +
        '  Introduced integration testing framework that cut production incidents by 60%.\n\n' +
        '2018-2019: Junior Software Engineer — TechCorp, Austin TX\n' +
        '  Shipped 12 features across the customer-facing web application.\n' +
        '  Wrote internal tooling in Python to automate deployment workflows.\n\n' +
        'Education: B.S. Computer Science, University of Texas at Austin, 2018.\n' +
        'References: available upon request.',
    },
    expectedLlmIsJobPosting: false,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'saas-marketing-careers',
    posting: {
      title: 'x',
      company: '',
      location: '',
      description:
        'Join the Helix Team — Build the Future of Healthcare Analytics\n\n' +
        'At Helix, we are on a mission to make precision medicine accessible to everyone. ' +
        'Our platform helps health systems turn genomic data into clinical decisions in real time. ' +
        'We are a team of 200+ builders backed by Andreessen Horowitz, and we are growing fast.\n\n' +
        'We hire world-class engineers across every layer of our stack. Whether you are a ' +
        'senior backend engineer who loves distributed data systems, a platform engineer ' +
        'who wants to own our Kubernetes infrastructure, a frontend engineer who builds ' +
        'beautiful clinical dashboards, a data engineer who wrangles genomic pipelines at ' +
        'scale, a machine learning engineer working on predictive diagnostics, or a ' +
        'security engineer hardening our HIPAA-compliant architecture — Helix has a home for you.\n\n' +
        'Why engineers choose Helix:\n' +
        '- Mission-driven work with real patient impact\n' +
        '- Competitive salaries, equity, and full benefits (health, dental, vision, 401k)\n' +
        '- Remote-first culture with quarterly off-sites\n' +
        '- $5,000 annual learning and development stipend\n' +
        '- Fast-moving environment where your work ships to production weekly\n\n' +
        'Interested in building with us? Visit helix.bio/careers to see all open engineer ' +
        'and non-engineer roles. We are actively interviewing for positions across engineering, ' +
        'product, design, and data science. Come shape the future of health at Helix.',
    },
    expectedLlmIsJobPosting: false,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },
];
