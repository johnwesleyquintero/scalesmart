export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { loadStaticData } from '../../../lib/load-static-data';
import type { BlogPost } from '../../../lib/static-data-types';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const query = 'seo';
    const blogPosts = await loadStaticData('blog');

    // Load tools data
    const tools = await loadStaticData('tools');

    const blogResults = blogPosts.filter(
      (post: BlogPost) =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query),
    );

    // Search tools
    const toolResults = tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query),
    );

    return NextResponse.json({
      blog: blogResults,
      tools: toolResults,
    });
  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
