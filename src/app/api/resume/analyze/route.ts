import { NextResponse } from 'next/server';

interface ResumeAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywords: {
    present: string[];
    missing: string[];
  };
  sections: {
    present: string[];
    missing: string[];
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Simulate analysis (replace with actual analysis logic)
    const analysis: ResumeAnalysis = {
      score: 78,
      strengths: [
        'Clear work history with measurable achievements',
        'Good use of action verbs',
        'Appropriate length (1-2 pages)',
      ],
      weaknesses: [
        'Missing quantifiable results in 3 positions',
        'Skills section could be more tailored to target jobs',
        'No certifications listed',
      ],
      suggestions: [
        "Add more metrics to quantify your impact (e.g., 'Increased sales by 30%')",
        'Include relevant certifications for your industry',
        'Tailor skills to match job descriptions more closely',
      ],
      keywords: {
        present: [
          'leadership',
          'project management',
          'JavaScript',
          'team collaboration',
        ],
        missing: [
          'TypeScript',
          'Agile methodologies',
          'CI/CD',
          'cloud computing',
        ],
      },
      sections: {
        present: ['Experience', 'Education', 'Skills'],
        missing: ['Certifications', 'Projects', 'Volunteer Work'],
      },
    };

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'An error occurred during analysis.' },
      { status: 500 },
    );
  }
}
