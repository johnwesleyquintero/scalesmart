import skills from '@/data/portfolio-data/skills.json';
import { getGitHubProjects } from '@/lib/github';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch data from GitHub and LinkedIn APIs
    const [projects] = await Promise.all([
      getGitHubProjects().catch((error) => {
        console.error('Error fetching GitHub projects:', error);
        return [];
      }),
    ]);

    return NextResponse.json({
      skills: skills.skills || [],
      projects: projects || [],
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch content',
        skills: skills.skills || [],
        projects: [],
        experience: [],
      },
      { status: 500 },
    );
  }
}
