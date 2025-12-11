export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { loadStaticData } from '../../../lib/load-static-data';
import type { BlogPost } from '../../../lib/static-data-types';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const query = 'seo';
    const blogPosts = await loadStaticData('blog');

    const tools: { name: string; description: string }[] = [];

    const blogResults = blogPosts.filter(
      (post: BlogPost) =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query),
    );

    const toolResults = [] as typeof tools;

    return NextResponse.json({
      blog: blogResults,
      tools: toolResults,
    });
  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
