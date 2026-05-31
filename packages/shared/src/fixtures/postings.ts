import type { AnalyzeResponse, JobPosting } from '../contracts.js';
import type { RiskBand } from '../risk.js';

export interface DemoFixture {
  id: string;
  band: RiskBand;
  label: string;
  posting: JobPosting;
  response: AnalyzeResponse;
}

export const DEMO_FIXTURES: DemoFixture[] = [
  {
    id: 'demo-legit-stripe',
    band: 'legitimate',
    label: 'Legitimate',
    posting: {
      title: 'Staff Software Engineer, Payments Infrastructure',
      company: 'Stripe',
      location: 'San Francisco, CA (Hybrid)',
      description: `We are hiring a Staff Software Engineer to join the Payments Infrastructure team at Stripe. This role reports to the Director of Payments Engineering and sits within a team of 14 engineers responsible for the reliability and scalability of Stripe's global payment processing pipeline.

Responsibilities:
- Design and evolve large-scale distributed systems processing millions of transactions per day
- Lead technical design reviews for the Payments Infrastructure team
- Mentor mid-level engineers and drive engineering excellence practices
- Collaborate cross-functionally with Product, Risk, and Compliance to ship reliable payment primitives

Requirements:
- 8+ years of software engineering experience with a focus on distributed systems
- Deep expertise in Go and/or TypeScript; familiarity with Kafka and PostgreSQL is strongly preferred
- Experience operating high-availability services (99.99%+ uptime SLAs) in production
- Strong written communication skills — Stripe is a writing-first culture

Compensation:
- Base salary: $220,000–$280,000 USD
- Equity: meaningful stock package with four-year vest and one-year cliff
- Annual performance bonus

Benefits:
- Comprehensive medical, dental, and vision insurance (100% employee premium covered)
- 401(k) with 4% employer match
- Generous parental leave (16 weeks primary caregiver)
- $3,000 annual learning and development budget
- Flexible PTO + 12 company holidays

We are committed to building a team as diverse as the people we serve. Stripe is an equal-opportunity employer.`,
      sourceUrl:
        'https://stripe.com/jobs/listing/staff-software-engineer-payments-infrastructure/123456',
    },
    response: {
      score: 87,
      risk: 'legitimate',
      reasons: [
        {
          text: 'Salary range clearly disclosed',
          signed: 8,
          evidenceQuote: '$220,000–$280,000 USD',
          signalKey: 'specificity',
        },
        {
          text: 'Specific tech stack listed',
          signed: 6,
          evidenceQuote: 'Go and/or TypeScript; familiarity with Kafka and PostgreSQL',
          signalKey: 'specificity',
        },
        {
          text: 'Team and reporting line clearly named',
          signed: 5,
          evidenceQuote:
            'Payments Infrastructure team … reports to the Director of Payments Engineering',
          signalKey: 'specificity',
        },
        {
          text: 'No buzzword inflation detected',
          signed: 4,
          signalKey: 'buzzword',
        },
      ],
      signalBreakdown: [
        { key: 'buzzword', ghostiness: 5, confidence: 1, weight: 0.33, contribution: 1.65 },
        { key: 'specificity', ghostiness: 8, confidence: 1, weight: 0.5, contribution: 4 },
        { key: 'scam', ghostiness: 3, confidence: 1, weight: 0.17, contribution: 0.51 },
      ],
      meta: { usedAi: false, model: 'demo-fixture' },
    },
  },

  {
    id: 'demo-caution-bigco',
    band: 'caution',
    label: 'Caution',
    posting: {
      title: 'Senior Product Manager, CRM Platform',
      company: 'Salesforce',
      location: 'Austin, TX',
      description: `Salesforce is seeking a Senior Product Manager to join our CRM Platform group in Austin. You will work in a fast-paced environment alongside a talented, cross-functional team of engineers, designers, and data analysts to define the roadmap for our next-generation CRM tools.

We are looking for a self-starter who is comfortable driving ambiguity to clarity and can balance strategic thinking with hands-on execution. You thrive in a collaborative environment and are passionate about building products that delight customers.

Responsibilities:
- Define and execute the product strategy for CRM Platform features used by over 150,000 businesses globally
- Work closely with engineering, design, and go-to-market teams to ship high-quality product increments
- Analyze usage data and synthesize customer feedback to identify opportunities and inform prioritization
- Develop clear business cases, PRDs, and success metrics for each initiative

Requirements:
- 5+ years of product management experience, ideally in B2B SaaS
- Strong analytical skills; experience with SQL and data visualization tools (Tableau, Looker) preferred
- Excellent written and verbal communication skills
- Experience with agile development methodologies

Compensation:
- Competitive compensation package commensurate with experience
- Salesforce equity (RSUs) included

Benefits:
- Health, dental, and vision insurance
- 401(k) with company match
- Flexible work arrangements and generous PTO
- Access to Salesforce's Volunteer Time Off program (7 days/year)`,
    },
    response: {
      score: 64,
      risk: 'caution',
      reasons: [
        {
          text: 'Generic-praise language detected (2 terms)',
          signed: -8,
          evidenceQuote: '… fast-paced environment … self-starter …',
          signalKey: 'buzzword',
        },
        {
          text: 'Description omits exact salary range',
          signed: -6,
          signalKey: 'specificity',
        },
        {
          text: 'Benefits list present with named items',
          signed: 4,
          evidenceQuote: 'Health, dental, and vision … 401(k) with company match',
          signalKey: 'specificity',
        },
        {
          text: 'Named tech stack partially specified',
          signed: 3,
          evidenceQuote: 'SQL and data visualization tools (Tableau, Looker)',
          signalKey: 'specificity',
        },
      ],
      signalBreakdown: [
        { key: 'buzzword', ghostiness: 40, confidence: 1, weight: 0.33, contribution: 13.2 },
        { key: 'specificity', ghostiness: 45, confidence: 1, weight: 0.5, contribution: 22.5 },
        { key: 'scam', ghostiness: 5, confidence: 1, weight: 0.17, contribution: 0.85 },
      ],
      meta: { usedAi: false, model: 'demo-fixture' },
    },
  },

  {
    id: 'demo-suspicious-vague',
    band: 'suspicious',
    label: 'Suspicious',
    posting: {
      title: 'Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'Remote',
      description: `Tech Solutions Inc. is a dynamic, innovative technology company seeking a talented Software Engineer to join our growing team. We are looking for a motivated and results-driven individual who thrives in a fast-paced environment and is passionate about making an impact.

As a Software Engineer, you will work on exciting projects using our modern tech stack to build scalable solutions for our clients across multiple industries. You will be part of a collaborative and inclusive culture where your ideas are valued and your growth is prioritized.

Responsibilities:
- Develop and maintain web and mobile applications using our modern tech stack
- Collaborate with team members to deliver high-quality software on time
- Participate in code reviews and contribute to best practices
- Stay up to date with emerging trends and technologies

Requirements:
- 3+ years of software engineering experience
- Proficiency in one or more modern programming languages
- Strong problem-solving skills and attention to detail
- Excellent communication skills and a team-player mindset
- Experience with agile methodologies preferred

What We Offer:
- A dynamic, fast-paced culture where you can grow
- Opportunity to work with cutting-edge technologies
- Supportive team environment
- Career advancement opportunities

We are growing fast and looking for rock stars who can hit the ground running and wear many hats as needed. Join our dynamic culture today!`,
    },
    response: {
      score: 32,
      risk: 'suspicious',
      reasons: [
        {
          text: 'No salary range disclosed',
          signed: -12,
          signalKey: 'specificity',
        },
        {
          text: 'Generic-praise language used (4 terms)',
          signed: -10,
          evidenceQuote: '… dynamic … fast-paced … rock stars … wear many hats …',
          signalKey: 'buzzword',
        },
        {
          text: 'Team structure and reporting line unclear',
          signed: -8,
          signalKey: 'specificity',
        },
        {
          text: 'No specific tech stack named',
          signed: -7,
          evidenceQuote: '… modern tech stack …',
          signalKey: 'specificity',
        },
      ],
      signalBreakdown: [
        { key: 'buzzword', ghostiness: 70, confidence: 1, weight: 0.33, contribution: 23.1 },
        { key: 'specificity', ghostiness: 80, confidence: 1, weight: 0.5, contribution: 40 },
        { key: 'scam', ghostiness: 15, confidence: 1, weight: 0.17, contribution: 2.55 },
      ],
      meta: { usedAi: false, model: 'demo-fixture' },
    },
  },

  {
    id: 'demo-ghost-classic',
    band: 'ghost',
    label: 'Likely Ghost Job',
    posting: {
      title: 'Rockstar Full-Stack Engineer (Immediate Start)',
      company: 'Stealth Startup',
      location: 'Remote / Anywhere',
      description: `Are you a rockstar engineer who is ready to change the world? We are a stealth startup disrupting the industry and we need ninja developers who can wear many hats and move fast!

We are looking for passionate self-starters who thrive in a dynamic, fast-paced environment where no two days are the same. If you are a hustler who loves wearing many hats and isn't afraid to roll up your sleeves, we want you on our team!

What you'll do:
- Build revolutionary products that will disrupt the entire industry
- Work across the full stack — we are flexible on technology (we use modern tools!)
- Collaborate with a rockstar team of visionaries and thought leaders
- Move fast and break things — we are looking for true entrepreneurs at heart

What we need:
- A real go-getter with 2-5 years of "experience" (passion matters more than a degree!)
- Full-stack versatility — if you can code, you're in!
- Someone who can hit the ground running with an immediate start — we can't wait!
- Apply TODAY because we are filling this role fast!

What's in it for you:
- Ground-floor opportunity at a game-changing company
- Flexible hours and remote work
- Equity upside (details TBD after you join)
- The chance to make a real impact!

Interested? DM us on Telegram @stealthhiring or send a WhatsApp message to our hiring manager. Apply immediately — positions are extremely limited and this opportunity won't last!`,
    },
    response: {
      score: 12,
      risk: 'ghost',
      reasons: [
        {
          text: 'Off-platform contact requested (messaging app)',
          signed: -15,
          evidenceQuote: '… DM us on Telegram @stealthhiring … WhatsApp message …',
          signalKey: 'scam',
        },
        {
          text: 'Heavy generic-praise language (6+ terms)',
          signed: -14,
          evidenceQuote: '… rockstar … ninja … wear many hats … fast-paced … hustler … go-getter …',
          signalKey: 'buzzword',
        },
        {
          text: 'Urgent hiring pressure detected',
          signed: -12,
          evidenceQuote: "… apply TODAY … immediate start … won't last …",
          signalKey: 'scam',
        },
        {
          text: 'No salary, stack, or company specifics disclosed',
          signed: -10,
          signalKey: 'specificity',
        },
      ],
      signalBreakdown: [
        { key: 'buzzword', ghostiness: 95, confidence: 1, weight: 0.33, contribution: 31.35 },
        { key: 'specificity', ghostiness: 98, confidence: 1, weight: 0.5, contribution: 49 },
        { key: 'scam', ghostiness: 90, confidence: 1, weight: 0.17, contribution: 15.3 },
      ],
      meta: { usedAi: false, model: 'demo-fixture' },
    },
  },
];
