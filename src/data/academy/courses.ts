import { Course } from '@/types/academy';

export const coursesData: Course[] = [
  {
    id: 'course-amazon-ads-foundations',
    slug: 'amazon-ads-foundations',
    title: 'Amazon Ads Foundations',
    level: 'Beginner',
    duration: '2h 44m',
    description:
      'Build your foundation in Amazon Ads. Understand the retail media ecosystem, campaign objectives, ad formats, and how ads interact with organic algorithm ranking.',
    modulesCount: 5,
    source: 'Amazon Ads Academy',
    topics: [
      'The Retail Media Landscape',
      'Retail Readiness Checklist',
      'Choosing Advertising Objectives',
      'Audience Segments & Targeting Foundations',
      'Reporting & Core KPI Benchmarks',
    ],
    operatorTakeaway:
      'Wesley’s Operator Note: Never turn on ads on a listing with fewer than 15 reviews or sub-4.0 star rating unless you enjoy incinerating working capital.',
    featured: true,
  },
  {
    id: 'course-sponsored-ads-engine',
    slug: 'sponsored-ads-engine',
    title: 'Sponsored Ads Campaign Architecture',
    level: 'Beginner',
    duration: '3h 52m',
    description:
      'Learn campaign structure, targeting types, bids, budgets, and placement adjustments. Master Sponsored Products, Sponsored Brands, and Sponsored Display setup.',
    modulesCount: 6,
    source: 'Amazon Ads Academy',
    topics: [
      'Single Keyword vs Multi-Keyword Ad Groups',
      'Auto-Targeting Harvest Strategies',
      'Negative Exact vs Negative Phrase Protocols',
      'Top-of-Search vs Rest-of-Search Bidding',
      'Daily Budget Pacing & Dayparting Truths',
    ],
    operatorTakeaway:
      'Wesley’s Operator Note: Dynamic bidding - Up and Down gives Amazon license to hike bids 100% on top of search. Use Down Only until your conversion rate is battle-tested.',
    featured: true,
  },
  {
    id: 'course-ppc-diagnostic-lab',
    slug: 'ppc-diagnostic-lab',
    title: 'Coach Wesley’s PPC Diagnostic Lab',
    level: 'Advanced',
    duration: '3h 15m',
    description:
      'Real-world operational scenarios: TACoS spikes, runaway search terms, sudden organic rank drops, and high-spend bleeders.',
    modulesCount: 7,
    source: 'ScaleSmart Operator Labs',
    topics: [
      'Scenario: TACoS increased 28% to 46% — what do you investigate first?',
      'Scenario: 1 campaign consuming 42% of spend with deteriorating CVR',
      'The 7-Step Diagnostic Protocol: Observe → Segment → Isolate → Act',
      'Search Term Bleeder Mining & Bid Compression',
    ],
    operatorTakeaway:
      'Wesley’s Operator Note: ACoS is an outcome, not an instruction. When ACoS jumps, investigate conversion rate first, click cost second, and budget throttling third.',
    featured: true,
  },
  {
    id: 'course-dsp-audience-engineering',
    slug: 'dsp-audience-engineering',
    title: 'Amazon DSP & Full-Funnel Architecture',
    level: 'Intermediate',
    duration: '2h 50m',
    description:
      'How to build deterministic audience pools, retarget cart abandoners, conquer competitor detail pages, and measure incremental lift with AMC clean room data.',
    modulesCount: 5,
    source: 'Amazon Ads Academy',
    topics: [
      'DSP Pixel Implementation & Custom Audiences',
      'In-Market vs Lifestyle vs ASIN Retargeting',
      'Frequency Capping Optimization',
      'Clean Room Attribution via AMC SQL',
    ],
    operatorTakeaway:
      'Wesley’s Operator Note: DSP remarketing should only be funded when your Sponsored Products search capture rate exceeds 65% for your core branded & unbranded keywords.',
    featured: false,
  },
];
