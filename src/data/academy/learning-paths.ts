import { LearningPath } from '@/types/academy';

export const learningPathsData: LearningPath[] = [
  {
    id: 'path-amazon-ppc-operator',
    slug: 'amazon-ppc-operator-path',
    title: 'Amazon PPC Operator Track',
    tagline: 'From theory to battlefield command of 7-figure ad budgets',
    description:
      'A structured 5-stage roadmap designed to take you from foundational retail readiness to running complex multi-ASIN advertising operations with mathematical discipline.',
    level: 'Advanced',
    estimatedTime: '~11.5 hours total',
    stepsCount: 5,
    steps: [
      {
        title: 'Stage 1: Amazon Ads Foundations',
        type: 'course',
        description:
          'Master Amazon’s official advertising ecosystem, ad units, and campaign objectives.',
      },
      {
        title: 'Stage 2: Sponsored Ads Deep Dive',
        type: 'course',
        description:
          'Architect scalable campaigns across Sponsored Products, Brands, and Display.',
      },
      {
        title: 'Stage 3: Advanced Optimization & Placement Math',
        type: 'course',
        description:
          'Placement multipliers, search term isolation, and budget pacing controls.',
      },
      {
        title: 'Stage 4: Coach Wesley Scenario Lab',
        type: 'scenario',
        description:
          'Solve real-world brand anomalies: rising TACoS, runaway search terms, and stockout defense.',
      },
      {
        title: 'Stage 5: Final Operator Assessment & Credential',
        type: 'assessment',
        description:
          'Pass the 50-question operational diagnostic exam to earn the ScaleSmart PPC Operator credential.',
      },
    ],
    targetCredential: 'ScaleSmart Amazon PPC Operator (Level 1)',
  },
  {
    id: 'path-ecommerce-operations-director',
    slug: 'ecommerce-operations-director-path',
    title: 'Amazon Brand Operations Director Track',
    tagline:
      'Scale systems, SOPs, and cross-functional teams without operational chaos',
    description:
      'For operators and founders who need to build anti-fragile operations across catalog management, inventory replenishment, FBA logistics, and automated SOP execution.',
    level: 'Expert',
    estimatedTime: '~14 hours total',
    stepsCount: 4,
    steps: [
      {
        title: 'Stage 1: Catalog Integrity & Crisis Drills',
        type: 'course',
        description:
          'Defend against suppressions, hijacking, attribute locks, and category errors.',
      },
      {
        title: 'Stage 2: FBA Inventory & Cash-Flow Velocity',
        type: 'course',
        description:
          'Restock limits, 3PL buffering, lead-time modeling, and cash cycle preservation.',
      },
      {
        title: 'Stage 3: Delegation & VA Operating System',
        type: 'course',
        description:
          'ScaleSmart’s battle-tested SOP creation, daily scorecards, and task auditing.',
      },
      {
        title: 'Stage 4: Operations Mastery Assessment',
        type: 'assessment',
        description:
          'Comprehensive evaluation of enterprise brand continuity systems.',
      },
    ],
    targetCredential: 'ScaleSmart Amazon E-Commerce Operations Systems',
  },
];
