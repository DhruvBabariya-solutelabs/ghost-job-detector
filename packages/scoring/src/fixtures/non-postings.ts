import type { JobPosting } from '@ghost/shared';

export interface NonPostingFixture {
  id: string;
  posting: JobPosting;
  expectedScore: 50;
  expectedLeadingReasonText: string;
}

const DOMINANT_NEGATIVE_TEXT = "This doesn't look like a job posting - score may not be meaningful";

export const NON_POSTING_FIXTURES: NonPostingFixture[] = [
  {
    id: 'lorem-200',
    posting: {
      title: 'x',
      company: '',
      location: '',
      description:
        'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
        'incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud ' +
        'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure ' +
        'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'resume-excerpt',
    posting: {
      title: 'x',
      company: '',
      location: '',
      description:
        'Emily Chen — Educator and Curriculum Specialist\n\n' +
        'Professional Summary: Dedicated K-12 science instructor with 8 years of classroom ' +
        'experience in urban and suburban school settings. Skilled at translating complex ' +
        'scientific concepts into accessible lessons for students across all learning ' +
        'levels. Passionate about STEM outreach and inquiry-based pedagogy.\n\n' +
        'Work History:\n' +
        '2018-present: Lead Science Instructor, Lincoln Middle School, Chicago IL\n' +
        '  - Taught AP Biology and Chemistry to 120+ students per academic year\n' +
        '  - Coordinated after-school science club with 40 participants\n' +
        '  - Guided six students to state science fair finals (2022, 2023)\n' +
        '  - Assessed student learning outcomes and adapted curriculum accordingly\n\n' +
        'Education: M.Ed. Curriculum and Instruction, Northwestern University 2018\n' +
        'B.S. Biology, University of Illinois Urbana-Champaign 2016\n\n' +
        'Certifications: Illinois Professional Educator License, AP Biology Endorsed.',
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'wikipedia-rfc-2616',
    posting: {
      title: 'x',
      company: '',
      location: '',
      description:
        'HTTP/1.1 (Hypertext Transfer Protocol version 1.1) was formally specified in RFC 2616, ' +
        'published in June 1999 by the IETF. It introduced persistent connections by default, ' +
        'allowing multiple requests and responses to be sent over a single TCP connection without ' +
        'the overhead of re-establishing the connection for each exchange. This improvement was ' +
        'significant compared to HTTP/1.0, which closed the connection after every transaction.\n\n' +
        'The protocol introduced chunked transfer encoding, which allowed servers to begin ' +
        'transmitting a response before knowing its total length — useful for dynamically ' +
        'generated content. HTTP/1.1 also added the Host header field, enabling virtual hosting ' +
        'by allowing multiple domain names to be served from a single IP address.\n\n' +
        'Cache-control directives were expanded to give both clients and servers fine-grained ' +
        'control over caching behavior. The OPTIONS and TRACE methods were added to support ' +
        'diagnostics and cross-origin preflight checks. Despite its age, HTTP/1.1 remains ' +
        'widely deployed alongside HTTP/2 and HTTP/3 as of 2025.',
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'song-lyrics',
    posting: {
      title: 'x',
      company: '',
      location: '',
      description:
        'Oh Shenandoah, I long to hear you,\nAway, you rolling river.\n' +
        "Oh Shenandoah, I long to hear you,\nAway, I'm bound away, 'cross the wide Missouri.\n\n" +
        "'Tis seven years since last I've seen you,\nAway, you rolling river.\n" +
        "'Tis seven years since last I've seen you,\nAway, I'm bound away, 'cross the wide Missouri.\n\n" +
        'Oh Shenandoah, I love your daughter,\nAway, you rolling river.\n' +
        "Oh Shenandoah, I love your daughter,\nAway, I'm bound away, 'cross the wide Missouri.\n\n" +
        "For her I've crossed the rolling water,\nAway, you rolling river.\n" +
        "For her I've crossed the rolling water,\nAway, I'm bound away, 'cross the wide Missouri.",
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },
];
