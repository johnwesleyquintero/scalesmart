import { NextResponse } from 'next/server';

const courses = [
  {
    id: '1',
    title: 'Amazon PPC Mastery',
    description:
      'Complete guide to Amazon Pay-Per-Click advertising strategies',
    duration: '6 hours',
    level: 'Intermediate',
    progress: 45,
    category: 'PPC',
    locked: false,
    modules: [
      {
        id: '1-3',
        title: 'Keyword Research',
        duration: '30 min',
        completed: false,
        type: 'article',
        contentSlug: 'mastering-amazon-ppc',
      },
      {
        id: '1-2',
        title: 'Campaign Structures',
        duration: '1 hour',
        completed: true,
        type: 'video',
      },
      {
        id: '1-4',
        title: 'PPC Quiz 1',
        duration: '15 min',
        completed: false,
        type: 'quiz',
      },
    ],
  },
  {
    id: '2',
    title: 'Amazon SEO Optimization',
    description: 'Master Amazon search algorithms and ranking factors',
    duration: '8 hours',
    level: 'Advanced',
    progress: 20,
    category: 'SEO',
    locked: false,
    modules: [
      {
        id: '2-1',
        title: 'SEO Basics',
        duration: '1 hour',
        completed: true,
        type: 'video',
      },
      {
        id: '2-2',
        title: 'Keyword Optimization',
        duration: '45 min',
        completed: false,
        type: 'article',
      },
      {
        id: '2-3',
        title: 'Listing Optimization',
        duration: '1.5 hours',
        completed: false,
        type: 'video',
      },
    ],
  },
  {
    id: '3',
    title: 'Advanced Amazon Strategy',
    description: 'Combine PPC and SEO for maximum sales impact',
    duration: '10 hours',
    level: 'Advanced',
    progress: 0,
    category: 'Strategy',
    locked: true,
    modules: [],
  },
];

export async function GET() {
  return NextResponse.json(courses);
}
