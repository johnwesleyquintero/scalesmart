import { loadStaticData } from '@/lib/load-static-data';
import { getGitHubProjects } from '@/lib/github';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const [skills, experience, education, personal, projects] =
      await Promise.all([
        loadStaticData('skills'),
        loadStaticData('experience'),
        loadStaticData('education'),
        loadStaticData('personal'),
        getGitHubProjects().catch((error) => {
          console.error('Error fetching GitHub projects:', error);
          return [];
        }),
      ]);

    return NextResponse.json({
      skills,
      experience,
      education,
      personal,
      projects,
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
