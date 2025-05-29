import { NextResponse } from 'next/server';
import { Course, ModuleType } from '@/types';

export async function GET() {
  // Define constants for repeated category strings
  const CATEGORY_PROGRAMMING = 'Programming';
  const CATEGORY_FRONTEND = 'Frontend';
  const CATEGORY_COMPUTER_SCIENCE = 'Computer Science';
  const CATEGORY_DIGITAL_MARKETING = 'Digital Marketing';
  const CATEGORY_AMAZON_FBA = 'Amazon FBA';

  const now = Date.now(); // Define a constant for the timestamp
  const dummyCourses: Course[] = [
    {
      id: 'course-1',
      title: 'Introduction to Web Development',
      type: ModuleType.ARTICLE,
      description: 'Learn the basics of HTML, CSS, and JavaScript.',
      duration: '2 hours',
      level: 'Beginner',
      locked: false,
      progress: 0,
      modules: [
        {
          id: 'module-1-1',
          title: 'HTML Fundamentals',
          duration: '30 minutes',
          completed: false,
          type: ModuleType.ARTICLE,
          contentSlug: 'html-fundamentals',
        },
        {
          id: 'module-1-2',
          title: 'CSS Styling',
          duration: '45 minutes',
          completed: false,
          type: ModuleType.VIDEO,
          videoUrl: 'https://example.com/css-video',
        },
      ],
      category: CATEGORY_PROGRAMMING,
      imageUrl: '/images/web-dev.png',
      slug: 'intro-to-web-dev',
      completed: false,
      isPublished: true, // Added to match AdminCourse interface
      creationTimestamp: now,
      updateTimestamp: now,
      metadata: {
        level: 'Beginner',
        tags: ['HTML', 'CSS', 'JavaScript'],
        category: CATEGORY_PROGRAMMING,
      },
    },
    {
      id: 'course-2',
      title: 'Advanced React Patterns',
      type: ModuleType.VIDEO,
      description: 'Explore advanced patterns and best practices in React.',
      duration: '5 hours',
      level: 'Advanced',
      locked: false,
      progress: 0,
      modules: [
        {
          id: 'module-2-1',
          title: 'Hooks Deep Dive',
          duration: '1 hour',
          completed: false,
          type: ModuleType.VIDEO,
          videoUrl: 'https://example.com/hooks-video',
        },
        {
          id: 'module-2-2',
          title: 'Context API and Reducers',
          duration: '1.5 hours',
          completed: false,
          type: ModuleType.ARTICLE,
          contentSlug: 'context-api',
        },
      ],
      category: CATEGORY_FRONTEND,
      imageUrl: '/images/react-patterns.png',
      slug: 'advanced-react-patterns',
      completed: false,
      isPublished: false, // Added to match AdminCourse interface
      creationTimestamp: now,
      updateTimestamp: now,
      metadata: {
        level: 'Advanced',
        tags: ['React', 'Frontend', 'JavaScript'],
        category: CATEGORY_FRONTEND,
      },
    },
    {
      id: 'course-3',
      title: 'Data Structures & Algorithms',
      type: ModuleType.EXERCISE,
      description: 'Master fundamental data structures and algorithms.',
      duration: '10 hours',
      level: 'Intermediate',
      locked: false,
      progress: 0,
      modules: [
        {
          id: 'module-3-1',
          title: 'Arrays and Linked Lists',
          duration: '2 hours',
          completed: false,
          type: ModuleType.EXERCISE,
          exercise: 'array-linked-list-exercises',
        },
      ],
      category: CATEGORY_COMPUTER_SCIENCE,
      imageUrl: '/images/dsa.png',
      slug: 'data-structures-algorithms',
      completed: false,
      isPublished: true, // Added to match AdminCourse interface
      creationTimestamp: now,
      updateTimestamp: now,
      metadata: {
        level: 'Intermediate',
        tags: ['Algorithms', 'Data Structures', 'Computer Science'],
        category: CATEGORY_COMPUTER_SCIENCE,
      },
    },
    {
      id: 'course-4',
      title: 'SEO Fundamentals for Beginners',
      type: ModuleType.ARTICLE,
      description:
        'Understand the basics of Search Engine Optimization to rank higher.',
      duration: '3 hours',
      level: 'Beginner',
      locked: false,
      progress: 0,
      modules: [
        {
          id: 'module-4-1',
          title: 'Introduction to SEO',
          duration: '45 minutes',
          completed: false,
          type: ModuleType.ARTICLE,
          contentSlug: 'seo-introduction',
        },
        {
          id: 'module-4-2',
          title: 'Keyword Research Basics',
          duration: '1 hour',
          completed: false,
          type: ModuleType.VIDEO,
          videoUrl: 'https://example.com/keyword-research-seo',
        },
      ],
      category: CATEGORY_DIGITAL_MARKETING,
      imageUrl: '/images/seo-fundamentals.png',
      slug: 'seo-fundamentals',
      completed: false,
      isPublished: true,
      creationTimestamp: now,
      updateTimestamp: now,
      metadata: {
        level: 'Beginner',
        tags: ['SEO', 'Digital Marketing', 'Search Engine Optimization'],
        category: CATEGORY_DIGITAL_MARKETING,
      },
    },
    {
      id: 'course-5',
      title: 'Amazon FBA Product Research Masterclass',
      type: ModuleType.CASE_STUDY,
      description:
        'Learn how to find profitable products to sell on Amazon FBA.',
      duration: '6 hours',
      level: 'Intermediate',
      locked: false,
      progress: 0,
      modules: [
        {
          id: 'module-5-1',
          title: 'Understanding Product Criteria',
          duration: '1.5 hours',
          completed: false,
          type: ModuleType.ARTICLE,
          contentSlug: 'fba-product-criteria',
        },
        {
          id: 'module-5-2',
          title: 'Using Research Tools Effectively',
          duration: '2 hours',
          completed: false,
          type: ModuleType.VIDEO,
          videoUrl: 'https://example.com/fba-research-tools',
        },
      ],
      category: CATEGORY_AMAZON_FBA,
      imageUrl: '/images/amazon-fba-research.png',
      slug: 'amazon-fba-product-research',
      completed: false,
      isPublished: false,
      creationTimestamp: now,
      updateTimestamp: now,
      metadata: {
        level: 'Intermediate',
        tags: [
          'Amazon FBA',
          'E-commerce',
          'Product Research',
          'Selling Online',
        ],
        category: CATEGORY_AMAZON_FBA,
      },
    },
  ];

  return NextResponse.json(dummyCourses);
}
