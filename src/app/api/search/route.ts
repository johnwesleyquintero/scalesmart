export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { loadStaticData } from '../../../lib/load-static-data';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';
import { BlogPost, DocPost } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase();

    if (!query) {
      return NextResponse.json(
        createErrorResponse('Search query is required', 'VALIDATION_ERROR'),
        { status: 400 },
      );
    }

    if (query.length < 2) {
      return NextResponse.json({
        blog: [],
        docs: [],
        tools: [],
        message: 'Query too short',
      });
    }

    const [blogPosts, docPosts] = await Promise.all([
      loadStaticData('blog'),
      loadStaticData('docs'),
    ]);

    const blogResults = blogPosts.filter(
      (post: BlogPost) =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        (post.content && post.content.toLowerCase().includes(query)) ||
        (post.tags &&
          post.tags.some((tag: string) => tag.toLowerCase().includes(query))),
    );

    const docResults = docPosts.filter(
      (post: DocPost) =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        (post.content && post.content.toLowerCase().includes(query)) ||
        (post.tags &&
          post.tags.some((tag: string) => tag.toLowerCase().includes(query))),
    );

    return NextResponse.json({
      blog: blogResults,
      docs: docResults,
      tools: [], // Placeholder for future tools search
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
