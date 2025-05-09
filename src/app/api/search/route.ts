export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { loadStaticData } from '../../../lib/load-static-data';
import type { BlogPost } from '../../../lib/static-data-types';

export async function GET() {
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
}
