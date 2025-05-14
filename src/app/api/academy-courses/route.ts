import {
  ARTICLE_TYPE,
  CATEGORIES,
  CONTENT_SLUG_ADVANCED_SEO_TECHNIQUES,
  Course,
  COURSE_DESCRIPTIONS,
  COURSE_TITLE_AMAZON_FBA_FUNDAMENTALS,
  COURSE_TITLE_AMAZON_PPC_MASTERY,
  COURSE_TITLE_AMAZON_SEO_OPTIMIZATION,
  COURSE_TYPE,
  GETTING_STARTED_FBA,
  LEVELS,
  MODULE_TITLE_NAVIGATING_SELLER_CENTRAL,
  PRODUCT_LISTING_GUIDE,
  QUIZ_TYPE,
  VIDEO_TYPE,
  YOUTUBE_SELLER_CENTRAL,
  YOUTUBE_URL,
} from '@/lib/academy-types';
import { NextResponse } from 'next/server';

// Define constants for duplicated strings
const ID_AMAZON_FBA_101 = 'amazon-fba-101';
const ID_AMAZON_PPC_MASTERY = 'amazon-ppc-mastery';
const ID_AMAZON_SEO_OPTIMIZATION = 'amazon-seo-optimization';
const ID_COURSE_ADVANCED_AMAZON_STRATEGY = 'advanced-amazon-strategy';

const courses: Course[] = [
  {
    id: COURSE_TITLE_AMAZON_FBA_FUNDAMENTALS,
    title: 'Amazon FBA Fundamentals',
    description: COURSE_DESCRIPTIONS.FBA_FUNDAMENTALS,
    duration: '2 hours',
    level: LEVELS.BEGINNER,
    progress: 0,
    locked: false,
    category: CATEGORIES.STRATEGY,
    type: COURSE_TYPE,
    modules: [
      {
        id: 'intro-amazon-selling',
        title: 'Introduction to Amazon Selling',
        duration: '15 min',
        completed: false,
        type: VIDEO_TYPE,
        contentSlug: YOUTUBE_URL,
      },
      {
        id: 'fba-overview',
        title: 'Understanding FBA Services',
        duration: '20 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: 'blog/understanding-fba-services',
      },
      {
        id: 'advanced-seo-techniques',
        title: 'Advanced Amazon SEO Techniques (2025)',
        duration: '30 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: CONTENT_SLUG_ADVANCED_SEO_TECHNIQUES,
      },
      {
        id: 'seller-central-tour',
        title: MODULE_TITLE_NAVIGATING_SELLER_CENTRAL,
        duration: '25 min',
        completed: false,
        type: VIDEO_TYPE,
        contentSlug: YOUTUBE_SELLER_CENTRAL,
      },
      {
        id: 'listing-products',
        title: 'How to List Your Products',
        duration: '30 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: PRODUCT_LISTING_GUIDE,
      },
      {
        id: 'pricing-strategy',
        title: 'Pricing Your Products',
        duration: '20 min',
        completed: false,
        type: VIDEO_TYPE,
        contentSlug: YOUTUBE_URL,
      },
      {
        id: 'knowledge-check',
        title: 'FBA Fundamentals Quiz',
        duration: '10 min',
        completed: false,
        type: QUIZ_TYPE,
      },
      {
        id: 'product-research',
        title: 'Product Research for FBA',
        duration: '45 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: 'blog/product-research',
      },
      {
        id: 'sourcing-products',
        title: 'Sourcing Products for FBA',
        duration: '60 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: 'blog/sourcing-products',
      },
      {
        id: 'creating-shipping-plan',
        title: 'Creating a Shipping Plan',
        duration: '30 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: 'blog/creating-shipping-plan',
      },
      {
        id: 'amazon-fba-fees',
        title: 'Understanding Amazon FBA Fees',
        duration: '45 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: 'blog/amazon-fba-fees',
      },
      {
        id: 'inventory-management',
        title: 'Inventory Management for FBA',
        duration: '60 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: 'blog/inventory-management',
      },
      {
        id: 'product-launch-strategies',
        title: 'Product Launch Strategies',
        duration: '60 min',
        completed: false,
        type: ARTICLE_TYPE,
        contentSlug: 'blog/product-launch-strategies',
      },
    ],
  },
  {
    id: COURSE_TITLE_AMAZON_PPC_MASTERY,
    title: 'Amazon PPC Mastery',
    description: COURSE_DESCRIPTIONS.PPC_MASTERY,
    duration: '6 hours',
    level: LEVELS.INTERMEDIATE,
    progress: 45,
    category: CATEGORIES.PPC,
    locked: false, // This was 'false,' - assuming it's a typo and should be false
    type: COURSE_TYPE,
    prerequisites: [ID_AMAZON_FBA_101],
    achievements: [
      {
        id: 'ppc-strategist',
        title: 'PPC Strategist',
        description: 'Master PPC campaign management',
        criteria: 'Complete all modules with 80% quiz score',
      },
    ],
    practicalExercises: [],
    modules: [],
  },
  {
    id: COURSE_TITLE_AMAZON_SEO_OPTIMIZATION,
    title: 'Amazon SEO Optimization',
    description: COURSE_DESCRIPTIONS.SEO_OPTIMIZATION,
    duration: '8 hours',
    level: LEVELS.ADVANCED,
    progress: 20,
    category: CATEGORIES.SEO,
    locked: false,
    type: COURSE_TYPE,
    prerequisites: [ID_AMAZON_FBA_101, ID_AMAZON_PPC_MASTERY], // This line was already using constants, but the ID itself was a literal
    achievements: [
      {
        id: 'seo-expert',
        title: 'SEO Expert',
        description: 'Master Amazon search optimization techniques',
        criteria: 'Complete all modules and implement optimization strategies',
      },
    ],
    practicalExercises: [],
    modules: [],
  },
  {
    id: ID_COURSE_ADVANCED_AMAZON_STRATEGY,
    title: 'Advanced Amazon Strategy',
    description: COURSE_DESCRIPTIONS.ADVANCED_STRATEGY,
    duration: '10 hours',
    level: LEVELS.ADVANCED,
    progress: 0,
    category: CATEGORIES.STRATEGY,
    locked: true,
    type: COURSE_TYPE,
    prerequisites: [ID_AMAZON_SEO_OPTIMIZATION, ID_AMAZON_PPC_MASTERY],
    achievements: [
      {
        id: 'master-strategist',
        title: 'Master Amazon Strategist',
        description: 'Achieve mastery in combined PPC and SEO strategies',
        criteria: 'Complete course and submit final strategy project',
      },
    ],
    practicalExercises: [],
    modules: [],
  },
];

export async function GET() {
  return NextResponse.json(courses);
}

export const fetchCourseContent = async (url: string) => {
  console.log('Fetching URL:', url); // Log the URL
  try {
    const res = await fetch(`http://localhost:3000${url}`);
    console.log('Fetch status:', res.status); // Log the status
    await res.text();

    const academyCourses = [
      {
        id: COURSE_TITLE_AMAZON_FBA_FUNDAMENTALS,
        title: 'Amazon FBA Fundamentals',
        description: COURSE_DESCRIPTIONS.FBA_FUNDAMENTALS,
        duration: '2 hours',
        level: LEVELS.BEGINNER,
        progress: 0,
        locked: false,
        category: CATEGORIES.STRATEGY,
        type: COURSE_TYPE,
        modules: [
          {
            id: 'intro-amazon-selling',
            title: 'Introduction to Amazon Selling',
            duration: '15 min',
            completed: false,
            type: VIDEO_TYPE,
            contentSlug: YOUTUBE_URL,
          },
          {
            id: 'fba-overview',
            title: 'Understanding FBA Services',
            duration: '20 min',
            completed: false,
            type: ARTICLE_TYPE,
            contentSlug: GETTING_STARTED_FBA,
          },
          {
            id: 'advanced-seo-techniques',
            title: 'Advanced Amazon SEO Techniques (2025)',
            duration: '30 min',
            completed: false,
            type: ARTICLE_TYPE,
            contentSlug: CONTENT_SLUG_ADVANCED_SEO_TECHNIQUES,
          },
          {
            id: 'seller-central-tour',
            title: MODULE_TITLE_NAVIGATING_SELLER_CENTRAL,
            duration: '25 min',
            completed: false,
            type: VIDEO_TYPE,
            contentSlug: YOUTUBE_SELLER_CENTRAL,
          },
          {
            id: 'listing-products',
            title: 'How to List Your Products',
            duration: '30 min',
            completed: false,
            type: ARTICLE_TYPE,
            contentSlug: PRODUCT_LISTING_GUIDE,
          },
          {
            id: 'pricing-strategy',
            title: 'Pricing Your Products',
            duration: '20 min',
            completed: false,
            type: VIDEO_TYPE,
            contentSlug: YOUTUBE_URL,
          },
          {
            id: 'knowledge-check',
            title: 'FBA Fundamentals Quiz',
            duration: '10 min',
            completed: false,
            type: QUIZ_TYPE,
          },
        ],
      },
      {
        id: COURSE_TITLE_AMAZON_PPC_MASTERY,
        title: 'Amazon PPC Mastery',
        description: COURSE_DESCRIPTIONS.PPC_MASTERY,
        duration: '6 hours',
        level: LEVELS.INTERMEDIATE,
        progress: 45,
        category: CATEGORIES.PPC,
        locked: false, // This was 'false,' - assuming it's a typo and should be false
        type: COURSE_TYPE,
        prerequisites: [ID_AMAZON_FBA_101],
        achievements: [
          {
            id: 'ppc-strategist',
            title: 'PPC Strategist',
            description: 'Master PPC campaign management',
            criteria: 'Complete all modules with 80% quiz score',
          },
        ],
        practicalExercises: [],
        modules: [],
      },
      {
        id: COURSE_TITLE_AMAZON_SEO_OPTIMIZATION,
        title: 'Amazon SEO Optimization',
        description: COURSE_DESCRIPTIONS.SEO_OPTIMIZATION,
        duration: '8 hours',
        level: LEVELS.ADVANCED,
        progress: 20,
        category: CATEGORIES.SEO,
        locked: false,
        type: COURSE_TYPE,
        prerequisites: [ID_AMAZON_FBA_101, ID_AMAZON_PPC_MASTERY], // This line was already using constants, but the ID itself was a literal
        achievements: [
          {
            id: 'seo-expert',
            title: 'SEO Expert',
            description: 'Master Amazon search optimization techniques',
            criteria:
              'Complete all modules and implement optimization strategies',
          },
        ],
        practicalExercises: [],
        modules: [],
      },
      {
        id: ID_COURSE_ADVANCED_AMAZON_STRATEGY,
        title: 'Advanced Amazon Strategy',
        description: COURSE_DESCRIPTIONS.ADVANCED_STRATEGY,
        duration: '10 hours',
        level: LEVELS.ADVANCED,
        progress: 0,
        category: CATEGORIES.STRATEGY,
        locked: true,
        type: COURSE_TYPE,
        prerequisites: [ID_AMAZON_SEO_OPTIMIZATION, ID_AMAZON_PPC_MASTERY],
        achievements: [
          {
            id: 'master-strategist',
            title: 'Master Amazon Strategist',
            description: 'Achieve mastery in combined PPC and SEO strategies',
            criteria: 'Complete course and submit final strategy project',
          },
        ],
        practicalExercises: [],
        modules: [],
      },
    ];

    return academyCourses;
  } catch (error) {
    console.error('Error fetching course content:', error);
    return null;
  }
};
