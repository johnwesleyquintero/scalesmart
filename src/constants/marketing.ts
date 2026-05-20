export const LANDING = {
  HERO: {
    badge: 'Systems-Driven Solutions',
    headlinePart1: 'We don’t just offer services—',
    headlinePart2: 'we build systems.',
    subhead:
      'ScaleSmart helps businesses move faster, operate smarter, and scale without chaos through digital solutions and optimized workflows.',
  },
  TRUSTED_BY: {
    header: 'Trusted by operators across these sectors',
    partners: [
      { name: 'Amazon FBA Operators', logo: 'AMZ' },
      { name: 'Shopify Plus Brands', logo: 'SHP' },
      { name: 'SaaS Startups', logo: 'SaaS' },
      { name: 'Digital Agencies', logo: 'AGY' },
      { name: 'Real Estate Teams', logo: 'REL' },
      { name: 'Content Creators', logo: 'CRT' },
    ],
  },
  WHY_US: {
    badge: 'THE SCALESMART DIFFERENCE',
    headerPart1: 'Why Choose ',
    headerPart2: 'ScaleSmart?',
    subhead:
      'We are more than an agency. We are your operational partners, dedicated to building the systems that make your growth inevitable.',
    quote:
      '"ScaleSmart didn\'t just give me a virtual assistant; they gave me a business that runs itself. The systems they built are the foundation of my success."',
    author: '— Elite E-commerce Client',
    reasons: [
      {
        title: 'Systems-First Approach',
        description:
          'We don’t just delegate tasks; we design the systems that make those tasks repeatable and efficient.',
      },
      {
        title: 'Trained & Vetted VAs',
        description:
          'Our team undergoes continuous training in high-level operations, ensuring they deliver quality from day one.',
      },
      {
        title: 'Automation Integration',
        description:
          'We blend human talent with modern AI and automation tools to reduce manual load and speed up execution.',
      },
      {
        title: 'Operational Transparency',
        description:
          'Get real-time visibility into your business metrics and team performance through our structured reporting.',
      },
      {
        title: 'Secure & Reliable',
        description:
          'Your data and processes are handled with strict professional care and industry-standard security protocols.',
      },
      {
        title: 'Time-Back Guarantee',
        description:
          'Our goal is simple: to give you back at least 10+ hours a week so you can focus on high-value growth.',
      },
    ],
  },
  HOW_IT_WORKS: {
    badge: 'OUR WAY',
    headerPart1: 'How ScaleSmart ',
    headerPart2: 'Works.',
    paragraphs: [
      'ScaleSmart is a full-service virtual support firm. This means that we are fully engaged in much of our clients’ daily tasks necessary to operate their businesses efficiently and effectively.',
      'As we handle the administrative tasks and systems, our clients are able to focus on generating revenue and high-level strategy for their businesses.',
      'Are you interested in working with us? Get your schedule back on track and take your life back.',
    ],
    primaryCta: 'Contact us today',
    steps: [
      {
        number: '01',
        title: 'Discovery & Audit',
        description:
          'We deep-dive into your current operations to identify bottlenecks and manual leaks that are slowing you down.',
      },
      {
        number: '02',
        title: 'Systems Design',
        description:
          'We architect your custom operational tech stack and workflows designed specifically for your business goals.',
      },
      {
        number: '03',
        title: 'Deployment & Placement',
        description:
          'We implement the systems and place highly-trained VAs to run them, ensuring a seamless transition.',
      },
      {
        number: '04',
        title: 'Optimization & Scale',
        description:
          'We continuously monitor performance and optimize your workflows to ensure long-term, chaos-free growth.',
      },
    ],
  },
  PROJECTS: {
    badge: 'Solutions & Systems',
    header: 'ScaleSmart Solutions',
    subhead:
      'Custom automation, integrations, and operational tools retrieved directly from our source.',
  },
  SUCCESS_STORIES: {
    badge: 'Proven Results',
    header: 'Success Stories',
    subhead:
      'Measurable impact delivered through ScaleSmart systems and automation.',
    readFullCta: 'Read Full Case Study',
  },
  ABOUT: {
    badge: 'The Team',
    headerPart1: 'We are a family-led team ',
    headerPart2: 'building the future of operations.',
    description:
      'ScaleSmart was founded in 2026 by brothers Wesley and Melkie Quintero. We combined our expertise in digital systems and management to help businesses move from chaos to clarity.',
    points: ['Focused on Clarity and Speed', 'Collaborative Systems Design'],
    primaryCta: 'Read Our Full Story',
  },
  BLOG: {
    header: 'Insights & Strategies',
    subhead:
      'Thoughts, playbooks, and systems for scaling Amazon brands and e-commerce operations.',
    emptyState: 'No articles found matching your criteria.',
    clearSearchCta: 'Clear Search & Filters',
    loadMoreCta: 'Load More Articles',
    viewAllCta: 'View All Articles',
    readArticleCta: 'Read Article',
  },
  CONTACT: {
    headerPart1: 'Ready to build your ',
    headerPart2: 'scaling system?',
    subhead:
      "Stop relying on guesswork. Let's engineer the precise infrastructure, workflows, and brand presence your agency needs to dominate.",
    primaryCta: 'Book a Strategy Call',
  },
  FOOTER: {
    description:
      'Helping businesses move faster, operate smarter, and scale without chaos through digital solutions and automated systems.',
    copyright: 'ScaleSmart. Built for operators, by operators.',
  },
} as const;

export type LandingCopy = typeof LANDING;
