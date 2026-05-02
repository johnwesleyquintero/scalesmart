import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

const staticContentDirectory = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  'src/app/content/static',
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const lowerSlug = slug.toLowerCase();

  // Support both .mdx and .md
  const extensions = ['.mdx', '.md'];
  let fullPath = '';

  for (const ext of extensions) {
    const p = path.join(staticContentDirectory, `${lowerSlug}${ext}`);
    if (fs.existsSync(p)) {
      fullPath = p;
      break;
    }
  }

  if (!fullPath) {
    console.warn(`WARNING: Static content not found for slug: ${slug}`);
    return NextResponse.json(
      createErrorResponse('Content not found', 'NOT_FOUND'),
      { status: 404 },
    );
  }

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const mdxSource = await serialize(content, {
      parseFrontmatter: false, // Frontmatter already parsed by gray-matter
    });

    return NextResponse.json({ source: mdxSource, frontmatter: data });
  } catch (error) {
    console.error(`Error reading static MDX file for slug ${slug}:`, error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
