import { Certification, CREDENTIAL_TRACKS } from '@/types/academy';

export const certificationsData: Certification[] = [
  {
    id: 'intro-amazon-ads',
    slug: 'introduction-to-amazon-ads',
    title: 'Introduction to Amazon Ads Certification',
    track: CREDENTIAL_TRACKS.AMAZON_ALIGNED,
    level: 'Beginner',
    duration: '1.6 hrs',
    modulesCount: 7,
    assessmentsCount: 1,
    shortDescription:
      'Validates an individual’s general knowledge of the Amazon Advertising ecosystem, planning, executing, and optimizing campaigns.',
    description:
      'The Introduction to the Amazon Ads Certification validates an individual’s general knowledge of the Amazon Advertising ecosystem. The certification is best suited for advertisers and agencies who want to validate their mastery in planning, executing, and optimizing Amazon Advertising campaigns.',
    topics: [
      'Amazon Ads ecosystem & retail readiness',
      'Advertising objectives & funnel alignment',
      'Ad formats & placements overview',
      'Audience targeting fundamentals',
      'Core performance metrics (ACoS, RoAS, CTR)',
    ],
    operatorFocus:
      'Wesley’s note: Master the terminology here so you speak fluent retail media before adjusting real bids.',
    featured: true,
    badgeLabel: 'Amazon Ads Certified',
  },
  {
    id: 'sponsored-ads',
    slug: 'sponsored-ads-certification',
    title: 'Sponsored Ads Certification',
    track: CREDENTIAL_TRACKS.AMAZON_ALIGNED,
    level: 'Beginner',
    duration: '2.4 hrs',
    modulesCount: 8,
    assessmentsCount: 1,
    shortDescription:
      'Demonstrates proficiency in Amazon Sponsored Ads campaigns, including Sponsored Products, Sponsored Brands, and Sponsored Display.',
    description:
      'Covers campaign structure, keyword research, targeting types (manual vs auto), bids, budgets, ad policies, and everyday campaign hygiene to drive scalable retail discovery.',
    topics: [
      'Sponsored Products, Brands & Display setup',
      'Keyword match types & negative targeting',
      'Default bid strategies and dynamic bidding',
      'Budget pacing and account health',
    ],
    operatorFocus:
      'Wesley’s note: Auto campaigns are exploratory probes; manual campaigns are high-confidence revenue engines.',
    featured: false,
    badgeLabel: 'Sponsored Ads Certified',
  },
  {
    id: 'sponsored-ads-advanced',
    slug: 'sponsored-ads-advanced-certification',
    title: 'Sponsored Ads Advanced Certification',
    track: CREDENTIAL_TRACKS.AMAZON_ALIGNED,
    level: 'Advanced',
    duration: '1.6 hrs',
    modulesCount: 6,
    assessmentsCount: 1,
    shortDescription:
      'Validates advanced knowledge of campaign optimization, reporting tools, bid strategies, and scaling multi-ASIN product portfolios.',
    description:
      'For experienced operators looking to deepen their analytical approach to Sponsored Ads. Focuses on advanced bid adjustments by placement, portfolio budget controls, search term harvesting, and multi-touch attribution.',
    topics: [
      'Top-of-search placement multiplier math',
      'Search term report mining & match isolation',
      'Seasonal budget surge management',
      'Inventory-aware campaign scaling',
    ],
    operatorFocus:
      'Wesley’s note: Bids are not static numbers. If inventory falls below 21 days of supply, your bid strategy must adapt immediately.',
    featured: false,
    badgeLabel: 'Advanced Sponsored Ads Specialist',
  },
  {
    id: 'amazon-ads-programmatic',
    slug: 'amazon-ads-programmatic-solutions',
    title: 'Amazon Ads Programmatic Solutions Certification',
    track: CREDENTIAL_TRACKS.AMAZON_ALIGNED,
    level: 'Intermediate',
    duration: '2.1 hrs',
    modulesCount: 7,
    assessmentsCount: 1,
    shortDescription:
      'Validates proficiency in Amazon DSP, audience segments, supply sources, and full-funnel programmatic campaign execution.',
    description:
      'Learn how to leverage programmatic display, streaming TV, and custom audience segments across Amazon properties and third-party exchanges to drive incremental customer acquisition.',
    topics: [
      'Amazon DSP architecture & inventory sources',
      'Custom audience creation & retargeting pools',
      'Frequency capping and brand safety controls',
      'Cross-channel attribution modeling',
    ],
    operatorFocus:
      'Wesley’s note: DSP without retail readiness is throwing budget into a furnace. Fix your listing conversion rate first.',
    featured: false,
    badgeLabel: 'DSP Specialist',
  },
  {
    id: 'amazon-video-ads',
    slug: 'amazon-video-ads-certification',
    title: 'Amazon Video Ads Certification',
    track: CREDENTIAL_TRACKS.AMAZON_ALIGNED,
    level: 'Intermediate',
    duration: '2.0 hrs',
    modulesCount: 6,
    assessmentsCount: 1,
    shortDescription:
      'Demonstrates your ability to plan, launch, and measure video advertising across Sponsored Brands video, Sponsored Display video, and Prime Video.',
    description:
      'Master video ad specifications, narrative pacing for sound-off mobile browsing, first 3-second hook frameworks, and performance measurement for brand lift and direct-response sales.',
    topics: [
      'Sponsored Brands Video asset guidelines',
      'Sound-off narrative and text overlay strategy',
      'Video completion rate (VCR) vs CTR vs CVR',
      'Creative iteration cycles',
    ],
    operatorFocus:
      'Wesley’s note: The first 2 seconds on mobile decide whether you pay for a glance or earn a purchase.',
    featured: false,
    badgeLabel: 'Video Ads Specialist',
  },
  {
    id: 'amazon-marketing-cloud',
    slug: 'amazon-marketing-cloud-certification',
    title: 'Amazon Marketing Cloud (AMC) Certification',
    track: CREDENTIAL_TRACKS.AMAZON_ALIGNED,
    level: 'Advanced',
    duration: '1.9 hrs',
    modulesCount: 5,
    assessmentsCount: 1,
    shortDescription:
      'Validates proficiency using AMC clean room queries to unlock cross-media attribution, path-to-purchase analysis, and lifetime value.',
    description:
      'Deep dive into privacy-safe SQL querying on event-level Amazon media data. Learn how to correlate DSP impressions with Sponsored Ads clicks, calculate media overlap, and measure new-to-brand acceleration.',
    topics: [
      'AMC data tables & SQL event schema',
      'Path to purchase & multi-touch exposure',
      'New-to-Brand (NTB) multi-channel lift',
      'High-value audience generation for DSP',
    ],
    operatorFocus:
      'Wesley’s note: AMC turns “gut feel” marketing debates into undeniable deterministic SQL queries.',
    featured: false,
    badgeLabel: 'AMC Analytics Certified',
  },
  {
    id: 'scalesmart-ppc-operator-l1',
    slug: 'scalesmart-amazon-ppc-operator',
    title: 'ScaleSmart Amazon PPC Operator (Level 1)',
    track: CREDENTIAL_TRACKS.OPERATOR_CREDENTIAL,
    level: 'Advanced',
    duration: '3.5 hrs',
    modulesCount: 9,
    assessmentsCount: 2,
    shortDescription:
      'Coach Wesley’s flagship operational certification: Account diagnostics, TACoS vs ACoS balancing, bid engineering, and anomaly hunting.',
    description:
      'Move beyond textbook definitions into live account ownership. Learn the exact frameworks used to audit 200+ ASIN catalogs, dissect spend anomalies, isolate wasted ad spend, and balance organic rank velocity with profitability.',
    topics: [
      'Diagnostic tree: Observe → Segment → Isolate → Act',
      'ACoS vs TACoS decoupling & margin safeguards',
      'Search term harvesting automation & negative rule engines',
      'Live scenario troubleshooting in high-pressure accounts',
    ],
    operatorFocus:
      'ScaleSmart Operator Core: ACoS is an outcome metric; bids and placement controls are leverage points.',
    featured: true,
    badgeLabel: 'ScaleSmart Certified Operator',
  },
  {
    id: 'scalesmart-tacos-strategist',
    slug: 'scalesmart-tacos-budget-strategist',
    title: 'ScaleSmart TACoS & Budget Allocation Strategist',
    track: CREDENTIAL_TRACKS.OPERATOR_CREDENTIAL,
    level: 'Advanced',
    duration: '2.8 hrs',
    modulesCount: 6,
    assessmentsCount: 1,
    shortDescription:
      'Master whole-business profitability engineering: Blended TACoS targets, organic halo economics, and inventory-synchronized spend allocation.',
    description:
      'Designed for brand directors and senior account managers responsible for overall EBITDA. Covers cash flow pacing, margin erosion alerts, SKU profitability tiers, and defensive vs offensive budget allocation.',
    topics: [
      'Portfolio SKU segmentation (Hero, Growth, Tail, Deadstock)',
      'Organic rank momentum tracking vs paid spend',
      'Stockout suppression protocols',
      'Executive P&L reporting frameworks',
    ],
    operatorFocus:
      'ScaleSmart Operator Core: Running ads on products with broken margins or negative unit economics is operational negligence.',
    featured: false,
    badgeLabel: 'ScaleSmart TACoS Strategist',
  },
  {
    id: 'scalesmart-ops-systems',
    slug: 'scalesmart-amazon-operations-systems',
    title: 'ScaleSmart Amazon E-Commerce Operations Systems',
    track: CREDENTIAL_TRACKS.OPERATOR_CREDENTIAL,
    level: 'Expert',
    duration: '4.2 hrs',
    modulesCount: 10,
    assessmentsCount: 2,
    shortDescription:
      'Comprehensive master credential for enterprise Amazon operators: SOPs, VA delegation workflows, catalog integrity, and crisis resolution.',
    description:
      'The complete operating operating system for scaling multi-million dollar brands. Covers listing suppression drills, hijack remediation, inventory replenishment triggers, and automated daily hygiene checklists.',
    topics: [
      'Operational SOP creation & SOP audits',
      'Listing compliance, hijack response & ticket escalation',
      'FBA supply chain forecasting & buffer alerts',
      'Building high-autonomy operator teams',
    ],
    operatorFocus:
      'ScaleSmart Operator Core: Great operators do not rely on heroic fire-fighting; they build anti-fragile systems.',
    featured: false,
    badgeLabel: 'ScaleSmart Systems Master',
  },
];
