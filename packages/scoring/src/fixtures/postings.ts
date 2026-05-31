import type { JobPosting } from '@ghost/shared';

export interface Fixture {
  id: string;
  posting: JobPosting;
  expectedBin: 'legitimate' | 'caution' | 'suspicious' | 'ghost';
  note: string;
}

export const FIXTURES: Fixture[] = [
  {
    id: 'meta-l5-swe',
    posting: {
      title: 'Software Engineer, Infrastructure (L5)',
      company: 'Meta Platforms, Inc.',
      location: 'Menlo Park, CA (Hybrid)',
      description: `We are looking for a Software Engineer to join our Infrastructure team at Meta. This is an L5 role reporting to the VP of Infrastructure Engineering, working within a team of 18 engineers focused on distributed systems and reliability.

Responsibilities:
- Design, build, and maintain large-scale distributed systems that serve billions of users
- Collaborate with the Payments Infrastructure team (cross-functional team of 12 engineers)
- Lead technical design reviews and mentor junior engineers
- Drive reliability improvements across our microservices stack

Requirements:
- 5+ years of software engineering experience
- Strong proficiency in TypeScript, Golang, or Python
- Experience with distributed systems, Kafka, and PostgreSQL
- Familiarity with Docker, Kubernetes, and Terraform

Compensation: $200,000 - $280,000 USD base salary + equity + bonus. Full benefits package including 401k matching, health insurance, dental, vision, and 20 days PTO.

Start date: Flexible; target Q3 2026. Standard 3-round interview process: phone screen, technical, system design.

Apply via: careers.meta.com (internal ATS link).`,
    },
    expectedBin: 'legitimate',
    note: 'faang-real | Meta SWE L5 — 3 buzzwords (rockstar-free) + all 8 specificity fields present; D-30 log cap + D-31 specificity-trumps-buzzwords keeps score in legitimate band. AI-SPEC §1b: salary specificity + tech stack + named reporting + team size.',
  },
  {
    id: 'stripe-staff-eng',
    posting: {
      title: 'Staff Software Engineer, Payments Platform',
      company: 'Stripe, Inc.',
      location: 'San Francisco, CA (Hybrid 3 days/week)',
      description: `Stripe is looking for a Staff Software Engineer to join the Payments Platform team. You will report directly to the Director of Engineering and work with a cross-functional team of 20 engineers building the core payment processing infrastructure used by millions of businesses worldwide.

What you will do:
- Architect and implement critical payment routing services at scale
- Partner with product and data science teams to drive platform reliability from 99.95% to 99.99%
- Lead technical direction for a squad of 6 engineers
- Drive quarterly reliability OKRs across the Payments Platform division

What we are looking for:
- 8+ years of software engineering, including 3+ years in a staff or principal role
- Deep expertise in distributed systems, Ruby on Rails, and PostgreSQL
- Experience with Kafka, Redis, and AWS infrastructure
- Strong track record of mentoring and technical leadership

Compensation range: $240,000 - $320,000 USD base + equity (0.05%-0.15% vesting over 4 years). Benefits: 401(k) with 6% match, health care (medical, dental, vision), parental leave, life insurance, and unlimited PTO.

Target start: January 2027 or negotiated. Interview process: recruiter screen, two technical rounds, system design, bar raiser.

Apply at stripe.com/jobs. No third-party recruiters.`,
    },
    expectedBin: 'legitimate',
    note: 'faang-real | Stripe Staff Eng — 2 buzzwords + all 8 specificity fields present (salary, stack, yoe, location, benefits, reporting, team, timeline); D-31 does not trigger (buzz count < 3) but buzz ghostiness is low so score stays in legitimate band.',
  },
  {
    id: 'yc-batch-founder',
    posting: {
      title: 'Full-Stack Engineer (Founding)',
      company: 'Aurum Health (YC S25)',
      location: 'San Francisco, CA',
      description: `Hey, we are building Aurum Health — AI-powered preventive care coordination for primary care clinics. We are 3 people, freshly out of YC S25, and we are hiring our first engineer.

What you would be working on: everything. Seriously. The backend (Next.js API routes, Postgres), the dashboard (React), the integrations (HL7 FHIR), the infrastructure. You would be one of the first three people and would have enormous ownership over what we build.

Who we are looking for: someone who has shipped production software before. You need 2+ years of production experience. You know TypeScript and SQL. You are comfortable being the person who makes decisions when there is no playbook. You thrive in ambiguity and you are a self-starter.

Compensation: we are pre-revenue so we cannot match FAANG comp. Equity is 1-2% depending on experience. We will revisit salary in 6 months once we close our seed. Right now we can offer $90k-$120k.

To apply: send a short email with your GitHub link and one thing you have shipped to founders@aurumhealth.io. We will respond within 48 hours.`,
    },
    expectedBin: 'caution',
    note: 'small-startup-vague | YC-batch founding engineer — 2 buzzwords (self-starter, thrive in ambiguity) + salary ($90k-$120k) + stack (TypeScript, Postgres, React) + yoe (2+ years) present; missing: benefits detail, reporting structure, timeline (3 absent fields = spec.ghostiness 0.45). D-32 floor 0.9 prevents drop to suspicious. AI-SPEC §1b: salary partially present, stack named, but vague company for a founding role.',
  },
  {
    id: 'seed-startup-eng',
    posting: {
      title: 'Backend Engineer',
      company: 'Klarro (Seed Stage)',
      location: 'Remote (US)',
      description: `Klarro helps SMB e-commerce stores reduce cart abandonment using behavioral analytics. We closed our seed round in January 2026.

We need a backend engineer who can own our data pipeline from end to end. Our stack is Python (FastAPI), PostgreSQL, and Redis. You would be working on this independently with strong ownership.

What matters to us:
- Proficiency in Python and SQL
- Interest in data engineering and analytics pipelines
- Ability to ship working software without much hand-holding

What we offer: salary commensurate with experience, equity stake. We are remote-first and flexible on hours. No formal benefits package yet at this stage.

If this sounds like you, apply at klarro.io/jobs or email jobs@klarro.io.`,
    },
    expectedBin: 'caution',
    note: 'small-startup-vague | seed startup — stack (Python, FastAPI, PostgreSQL, Redis) + location (Remote) present; missing: salary range (commensurate = absent), yoe (no explicit years), benefits (none yet), reporting, team size, timeline (4 absent fields = spec.ghostiness 0.60). No buzzwords or scam. D-32 floor 0.9 prevents drop to suspicious. AI-SPEC §1b: human-voiced pre-PMF startup, multiple specificity fields absent by design.',
  },
  {
    id: 'india-bangalore-swe',
    posting: {
      title: 'Senior Software Engineer — Platform',
      company: 'Razorpay',
      location: 'Bangalore, India (Hybrid)',
      description: `Razorpay is India's leading payments solutions company, serving 8 million businesses. We are hiring a Senior Software Engineer for our Platform Infrastructure team.

About the role:
- Design and build APIs and microservices for our core payments platform
- Work with a team of 15 engineers in the Platform vertical
- Report to the Engineering Manager, Platform Services
- Own reliability of services processing 5M+ transactions daily

Requirements:
- 4-6 years of software engineering experience
- Strong skills in Golang, Java, or Python
- Experience with distributed systems, Kafka, and PostgreSQL
- Familiarity with Docker and Kubernetes

Compensation: As per industry standards (salary disclosure is not legally required for Indian postings; compensation discussed at offer stage). Benefits include health insurance, PTO, and stock options with 4-year vesting.

Start date: Target March 2026 or mutually agreed. Standard interview process: online assessment, two technical rounds, system design.

Apply: razorpay.com/jobs`,
    },
    expectedBin: 'legitimate',
    note: 'intl-v1-blindspot | Bangalore SWE — no explicit salary range per India market norm (CONTEXT D-34 deferred; salary disclosure not legally required outside US/EU). All other specificity fields present: stack, yoe, location, benefits, reporting, team, timeline. AI-SPEC §1b: geographic-disclosure alignment is a v1 blind spot. Engine should not penalize heavily.',
  },
  {
    id: 'london-fintech',
    posting: {
      title: 'Software Engineer, Regulatory Technology',
      company: 'Thought Machine',
      location: 'London, UK (Hybrid)',
      description: `Thought Machine builds cloud-native core banking technology. Our Vault platform powers banks across 3 continents. We are hiring a Software Engineer for our Regulatory Technology team in London.

Role overview:
- Implement compliance and regulatory reporting features within Vault Core
- Work within a cross-functional engineering team of 10, reporting to the Senior Engineering Manager
- Partner with legal and compliance experts to translate regulatory requirements into software
- 3+ years of software engineering experience required

Technical stack: Golang, Python, PostgreSQL, Google Cloud Platform (GCP). We also use Terraform and Kubernetes for infrastructure.

Compensation: GBP 85,000 - GBP 110,000 per year, plus annual bonus and equity options. Benefits: private health insurance (BUPA), dental, vision, pension (employer matches 5%), 25 days holiday plus bank holidays.

Target start: Q2 2026. Interview process: technical screen, two engineering rounds, leadership interview.

Apply at thoughtmachine.net/careers.`,
    },
    expectedBin: 'legitimate',
    note: 'intl-v1-blindspot | London fintech — EU pay transparency context (Directive 2023/970 transposition by June 2026). Salary in GBP disclosed. All 8 specificity fields present: salary, stack, yoe, location, benefits, reporting, team, timeline. AI-SPEC §1b: regulatory tech posting; legitimate EU-style disclosure.',
  },
  {
    id: 'midmarket-senior-fe',
    posting: {
      title: 'Senior Frontend Engineer',
      company: 'Rippling',
      location: 'Austin, TX (Hybrid 2 days/week)',
      description: `Rippling is building the world's first global workforce management platform. We are hiring a Senior Frontend Engineer to join our Payroll Engineering team.

What you will do:
- Build and maintain React-based interfaces used by thousands of HR teams globally
- Collaborate with 8 other engineers in the Payroll Frontend squad
- Report to the Frontend Engineering Lead
- Ship high-quality TypeScript + React + GraphQL features on a 2-week sprint cycle

Requirements:
- 5+ years of experience building production web applications
- Strong proficiency in TypeScript, React, and GraphQL
- Experience with modern frontend testing (Jest, React Testing Library)
- Familiarity with Node.js and REST APIs

Salary range: $160,000 - $200,000 USD. Benefits: 401(k) matching, health insurance (medical, dental, vision), equity, 20 days PTO, parental leave.

Interview process: recruiter call, take-home project, technical review, hiring manager call. Start date flexible; target Q2 2026.

Apply at rippling.com/jobs.`,
    },
    expectedBin: 'legitimate',
    note: 'generic-real | mid-market senior frontend — salary + stack + team + reporting + benefits + yoe + location + timeline all present. AI-SPEC §1b: salary specificity, tech stack, named team, reporting structure all disclosed.',
  },
  {
    id: 'midmarket-backend',
    posting: {
      title: 'Backend Software Engineer',
      company: 'Brex',
      location: 'New York, NY (Remote-friendly)',
      description: `Brex builds modern financial services for fast-growing companies. We are hiring a Backend Software Engineer for our Spend Management team.

Responsibilities:
- Design and implement APIs powering Brex's expense management product
- Work within a cross-functional squad of 7 engineers
- Report to the Engineering Manager, Spend Platform
- Own service reliability and help the team hit 99.9% uptime SLAs

What we are looking for:
- 3-5 years of backend engineering experience
- Proficiency in Golang or Elixir; experience with PostgreSQL and Redis
- Comfort with AWS, Docker, and Kubernetes
- Experience working in a fast-paced product engineering environment

Compensation: $150,000 - $190,000 USD base salary + equity. Benefits include 401k, health insurance (medical, dental, vision), unlimited PTO, and parental leave.

Start date: target Q1 2026, flexible by 4 weeks. Interview: coding screen, system design, team fit.

Applications: brex.com/careers`,
    },
    expectedBin: 'legitimate',
    note: 'generic-real | Brex backend — all 8 specificity fields present. AI-SPEC §1b: concrete tech stack, salary range, named team and reporting.',
  },
  {
    id: 'midmarket-platform',
    posting: {
      title: 'Platform Engineer (SRE)',
      company: 'Gusto',
      location: 'Denver, CO (Hybrid)',
      description: `Gusto simplifies HR and payroll for small businesses. We are hiring a Platform Engineer to join our Site Reliability team in Denver.

What you will do:
- Build and operate our Kubernetes-based deployment platform serving all Gusto engineering teams
- Work with a platform team of 9 engineers reporting to the VP of Platform Engineering
- Drive infrastructure-as-code adoption using Terraform and AWS
- Respond to on-call incidents (~1 week every 9 weeks) and improve runbooks

Requirements:
- 4+ years of SRE or DevOps experience
- Strong skills in Kubernetes, Terraform, and AWS
- Experience with Python or Golang for automation
- Familiarity with PostgreSQL and Redis in production

Salary: $145,000 - $175,000 USD. Benefits include 401(k) with company match, health insurance, dental, vision, life insurance, equity, and 18 days PTO plus sick leave.

Interview process: technical screen, SRE-focused system design, reliability culture interview. Target start: March 2026.

Apply: gusto.com/jobs`,
    },
    expectedBin: 'legitimate',
    note: 'generic-real | Gusto SRE — salary disclosed (CO Equal Pay for Equal Work Act applies), all 8 fields present. AI-SPEC §1b: pay-transparency law compliance, named reporting chain, concrete on-call cadence.',
  },
  {
    id: 'midmarket-data-eng',
    posting: {
      title: 'Data Engineer',
      company: 'Faire',
      location: 'Boston, MA (Hybrid)',
      description: `Faire connects independent retailers with brands through its wholesale marketplace. We are hiring a Data Engineer to join our Data Platform team.

Role:
- Build and maintain data pipelines processing millions of marketplace transactions daily
- Partner with a cross-functional data team of 11 engineers
- Report to the Data Engineering Manager
- Own our Airflow-based orchestration layer and help migrate to a modern data stack

Requirements:
- 3+ years of data engineering experience
- Proficiency in Python and SQL; experience with dbt, Airflow, and Snowflake
- Familiarity with Kafka and AWS data services
- Comfort shipping production-quality data systems

Compensation: $130,000 - $165,000 USD. Benefits: 401(k) matching, full health insurance suite, equity, 20 days PTO, parental leave.

Start date: target Q2 2026. Interview process: take-home assessment, two technical rounds, data culture interview.

Apply at faire.com/careers`,
    },
    expectedBin: 'legitimate',
    note: 'generic-real | Faire data engineering — all 8 fields present, concrete stack (Python, dbt, Airflow, Snowflake, Kafka), salary disclosed per MA pay transparency, team and reporting named. AI-SPEC §1b: stack specificity + salary + team + timeline.',
  },
  {
    id: 'ghost-whatsapp-urgent',
    posting: {
      title: 'Remote Work From Home Data Entry Specialist',
      company: '',
      location: 'Remote',
      description: `URGENT HIRING! We are a fast-growing, dynamic company looking for rockstar team players to join our amazing team immediately! Earn $5,000/week working from home — no experience required!

We are an established firm offering the best-in-class opportunity for self-starters who thrive in ambiguity and want to wear many hats. This is a world-class chance to be part of something incredible.

Duties:
- Enter data into our proprietary system
- Process orders and respond to customer inquiries
- Complete simple online tasks from your home computer

Requirements: reliable internet, ability to start ASAP, must be available immediately.

Compensation: $5,000/week guaranteed, paid every Friday via direct deposit. No experience necessary — we train everyone.

To apply: contact our hiring team on WhatsApp at +1-555-987-6543 or email us at hirefast2026@gmail.com. Do NOT apply through the platform — contact us directly today only for fastest consideration!`,
    },
    expectedBin: 'ghost',
    note: 'scam-classic | WhatsApp + Gmail + urgency + unrealistic comp ($5000/week) — Dim 3 PASS gate. FBI IC3 PSA 2022: messaging-app contact is #1 scam vector; $5k/week is unrealistic for data entry. 5+ buzzwords (rockstar, fast-growing, dynamic, best-in-class, self-starters, thrive in ambiguity, wear many hats, world-class). 7+ specificity fields missing. Scam signals must drive this to ghost band.',
  },
  {
    id: 'ghost-telegram-quick-hire',
    posting: {
      title: 'Customer Support Agent — Work From Home',
      company: '',
      location: 'Remote',
      description: `URGENT — we are hiring IMMEDIATELY! Join our industry-leading, world-class customer support team today. We need self-starters who can start tomorrow. This is a high-velocity opportunity for top-tier candidates who are true team players!

Job description:
- Respond to customer messages via chat
- Process refund requests
- Log issues in our ticketing system

This is a reputable company in the e-commerce industry. Established firm with clients worldwide. We are urgently seeking candidates who can begin this week.

Pay: $2,500/month for 4 hours/day. Equipment will be provided — we will send you a check to cover your laptop purchase from our designated vendor before your start date.

Contact: Message us on Telegram @quickhire_jobs or email quickhire2026@yahoo.com. Apply fast — limited spots available! Must start immediately.`,
    },
    expectedBin: 'ghost',
    note: 'scam-classic | Telegram + Yahoo email + equipment-purchase check fraud + urgency + unrealistic comp — multiple scam vectors from FTC Consumer Alert Sept 2025 and FBI IC3. 5+ buzzwords (urgent, immediately, industry-leading, world-class, self-starters, top-tier, team players, high-velocity). Equipment purchase check fraud is definitional scam pattern per FTC.',
  },
  {
    id: 'ghost-signal-recruiter',
    posting: {
      title: 'Virtual Assistant / Administrative Coordinator',
      company: '',
      location: 'Remote',
      description: `We are seeking dynamic, rockstar virtual assistants for an urgent opening at our established firm. This is a world-class work-from-home opportunity — top-tier pay, flexible hours!

Responsibilities: scheduling, data entry, email management, basic research tasks. No experience needed. We are a reputable company providing administrative outsourcing to Fortune 500 clients.

Pay: $800/week working only 3 hours per day. All equipment provided — you will receive a check in advance and can purchase supplies from our vendor list.

Requirements: computer, internet, ability to start ASAP. Must be available to start tomorrow. We are hiring urgently — positions fill fast!

Contact us IMMEDIATELY on Signal at +1-555-321-7890 or at virtualstaff_hire@hotmail.com. Do NOT apply through this platform — contact us directly. Today only pricing for the fastest applicants!`,
    },
    expectedBin: 'ghost',
    note: 'scam-classic | Signal + Hotmail + equipment-purchase + urgency + unrealistic comp ($800/week, 3h/day) — FBI IC3 2025 employment-scam pattern. 5+ buzzwords (dynamic, rockstar, world-class, top-tier, reputable company). All 8 specificity fields missing (no salary range, stack, yoe, office location, benefits, reporting, team, timeline). Scam signals + high buzzword count + zero specificity drives to ghost band.',
  },
  {
    id: 'ai-slop-generic-1',
    posting: {
      title: 'Software Engineer',
      company: 'TechVision Global',
      location: 'Remote',
      description: `We are seeking a passionate and driven Software Engineer to join our fast-paced team. As a self-starter who thrives in ambiguity, you will have the opportunity to grow professionally in our world-class environment.

In this role, you will build scalable web applications using JavaScript and React. You will collaborate with product and design teams, write clean code, and participate in code reviews.

Responsibilities:
- Develop and maintain software applications
- Collaborate with product and design teams
- Write clean, maintainable code
- Participate in code reviews and team meetings

Requirements:
- Experience with JavaScript, React, or similar web technologies
- Strong problem-solving skills
- Excellent communication skills
- Ability to work independently and as part of a team

We offer a great work culture and the chance to make an impact. Apply today to join our team!`,
    },
    expectedBin: 'suspicious',
    note: 'ai-slop | template-y prose — 3 buzzwords (fast-paced, self-starter, world-class; "thrives in ambiguity" does not match \bthrive in ambiguity\b) + stack (JavaScript, React) + team (team meetings) present; 6 fields missing (salary, yoe, location, benefits, reporting, timeline). spec.ghostiness=0.80; score approx 26. No scam. AI-SPEC §1b: buzzword saturation + missing specificity = suspicious but not ghost.',
  },
  {
    id: 'ai-slop-generic-2',
    posting: {
      title: 'Product Manager',
      company: 'Innovate Solutions Inc.',
      location: 'Remote',
      description: `Are you a passionate product leader looking for an exciting opportunity to make a real impact? Innovate Solutions Inc. is seeking a rockstar Product Manager to join our fast-paced remote team.

As our new Product Manager, you will be the driving force behind our world-class product roadmap. You will thrive in ambiguity and collaborate across all functions to deliver great features to our customers.

Key Responsibilities:
- Define and prioritize the product roadmap
- Work closely with engineering and design
- Gather and analyze customer feedback using SQL and our analytics dashboard
- Drive product launches and go-to-market strategies

What We Are Looking For:
- Proven track record in product management
- Strong analytical and communication skills
- Experience with agile methodologies
- Passion for technology and innovation

What We Offer: amazing culture, opportunities for growth, and the chance to be part of something big. Join our team and help us change the world!`,
    },
    expectedBin: 'suspicious',
    note: 'ai-slop | 4 buzzwords (rockstar, fast-paced, world-class, thrive in ambiguity) + location (remote) + stack (SQL) + team (remote team) present; 5 fields missing (salary, yoe, benefits, reporting, timeline). spec.ghostiness=0.75; score approx 24. No scam. AI-SPEC §1b: LLM-shape phrasing but not enough scam signals for ghost.',
  },
  {
    id: 'ai-slop-generic-3',
    posting: {
      title: 'Marketing Manager',
      company: 'Nexus Digital Group',
      location: 'Remote',
      description: `Nexus Digital Group is searching for a world-class Marketing Manager to join our team. We are a growing remote-first organization and we are looking for a self-starter who can thrive in ambiguity in our fast-paced environment.

Job Duties:
- Develop and execute marketing campaigns across digital channels
- Manage social media presence and content calendar
- Analyze marketing metrics using SQL and report on ROI
- Collaborate with the sales team to generate leads

What You Bring:
- Experience in digital marketing
- Knowledge of SEO, SEM, and social media marketing
- Excellent written and verbal communication
- Creative mindset and attention to detail

Why Join Us:
- Great culture with growth opportunities
- Remote-first with flexible schedule

Apply now and become part of our story!`,
    },
    expectedBin: 'suspicious',
    note: 'ai-slop | 4 buzzwords (world-class, self-starter, thrive in ambiguity, fast-paced) + location (remote) + stack (SQL) + team (sales team) present; 5 fields missing (salary, yoe, benefits, reporting, timeline). spec.ghostiness=0.75; score approx 24. No scam. AI-SPEC §1b: AI-detection unreliability caveat — buzzword saturation without scam signals stays in suspicious band.',
  },
  {
    id: 'borderline-vague-1',
    posting: {
      title: 'Full Stack Developer',
      company: 'CloudStack Labs',
      location: 'Austin, TX',
      description: `CloudStack Labs is a growing software company building B2B SaaS tools for operations teams. We are looking for a full stack developer to help us grow.

What you will work on: our core product is built on React and Node.js with a PostgreSQL database. You would be working across the stack, shipping features end to end.

We are a small team of 6 developers. You would have significant ownership of the product and technical decisions. We move quickly but try to write good code.

Requirements: 3+ years of experience building web applications, comfortable with JavaScript/TypeScript and SQL. A portfolio of shipped work is helpful.

Compensation: not publicly listed; discussed at offer stage and based on experience and market rates. We offer equity and health insurance. Remote or Austin office (hybrid optional).`,
    },
    expectedBin: 'caution',
    note: 'borderline | vague but no scam — no salary range (missing), team size mentioned (6), stack named (React, Node.js, PostgreSQL). Missing: salary, benefits detail, reporting, timeline. 1 buzzword or fewer. Caution expected: specific enough to not be suspicious, but missing enough fields for legitimate. Tests AI-slop-vs-scam distinction (no scam signals means this stays in caution not ghost).',
  },
  {
    id: 'borderline-vague-2',
    posting: {
      title: 'Software Engineer',
      company: 'Meridian Analytics',
      location: 'Chicago, IL (Remote OK)',
      description: `Meridian Analytics helps mid-market companies make better decisions with their data. We are a 30-person company and we are looking for a software engineer to join our product team.

You would be working on our analytics platform, which is built with Python (FastAPI) and React. Our data layer uses PostgreSQL and Snowflake. We process around 500 million events per month.

About you: you have a few years of experience building web applications or data products. You care about code quality and enjoy working with data.

What we offer: salary commensurate with experience, health benefits, equity, and a good remote setup stipend. We are flexible on start date.

If this sounds interesting, send us an email at jobs@meridiananalytics.com with your background.`,
    },
    expectedBin: 'caution',
    note: 'borderline | intentionally vague on salary ("commensurate") + no exact yoe + no timeline + no reporting. Tech stack present (Python, FastAPI, React, PostgreSQL, Snowflake). Company email domain used (legitimate signal per FTC). No buzzwords or scam signals. Tests absence-of-salary caution without ghost.',
  },
  {
    id: 'scam-equipment-purchase',
    posting: {
      title: 'Remote Administrative Assistant',
      company: '',
      location: 'Remote',
      description: `Our established firm is urgently hiring remote administrative assistants to join our world-class, industry-leading administrative support team. No experience required — we will train you!

This is a top-tier remote opportunity with competitive comp. You will be a self-starter who can thrive in ambiguity and wear many hats in our dynamic, fast-paced environment.

Duties: data entry, scheduling, email correspondence, document management.

Pay: $1,500/week part-time. We will get you started immediately.

Equipment and onboarding: to get started, you will receive a refundable deposit check from us. Use it to buy equipment from our approved vendor list — simply purchase your work laptop and peripherals, then we will reimburse you on your first paycheck. Send the remainder of the check back to us via wire transfer within 2 business days.

To apply: email adminstaff_careers@gmail.com or message us at hirefast_admin on Telegram.`,
    },
    expectedBin: 'ghost',
    note: 'scam-equipment | buy-equipment-from-our-vendor pattern — definitional FTC employment-scam shape. "Refundable deposit check" + "buy equipment" + "wire transfer" are the check-fraud triad per FTC "Taking the ploy out of employment scams" (2023). Also: messaging-app contact (Telegram) + Gmail + urgency + unrealistic comp ($1500/week part-time) + 5+ buzzwords (world-class, industry-leading, top-tier, competitive comp, self-starter, thrive in ambiguity, wear many hats, dynamic, fast-paced).',
  },
  {
    id: 'scam-crypto-job',
    posting: {
      title: 'Crypto App Review Specialist — Work From Home',
      company: '',
      location: 'Remote',
      description: `URGENT OPPORTUNITY! Earn $500/day reviewing cryptocurrency trading applications from home. No experience required! This is a world-class, best-in-class opportunity for top-tier self-starters who want to be their own boss.

How it works: you will evaluate mobile apps, provide feedback on user experience, and test transaction flows. Simple tasks, amazing pay. Work just 2-3 hours per day from anywhere!

Requirements: smartphone, internet connection. Must start ASAP — spots fill fast. Must be available immediately.

Our reputable company partners with leading crypto exchanges. Established firm with 3+ years in the industry. No technical background required.

Compensation: $500/day guaranteed, paid in USDT or Bitcoin weekly. $3,500/week minimum guaranteed.

To apply: WhatsApp our hiring coordinator at +1-555-456-7890 today only or email cryptojobs_apply@yahoo.com. Do not use the platform apply button — contact us directly for immediate consideration.`,
    },
    expectedBin: 'ghost',
    note: 'scam-crypto | $500/day crypto app review — FBI cryptocurrency-job-scam shape (FBI 2025: "earn $500/day reviewing apps"). WhatsApp + Yahoo email + urgency + unrealistic comp ($3500/week minimum for 2-3h/day). Vague company description (reputable company, established firm). 5+ buzzwords (world-class, best-in-class, top-tier, self-starters). 7+ specificity fields missing. Multiple scam patterns firing simultaneously.',
  },
];
