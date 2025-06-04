import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { handleApiError } from '@/lib/api-error-handler';

const staticContentDirectory = path.join(
  process.cwd(),
  'src/app/content/static',
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const fullPath = path.join(staticContentDirectory, `${slug}.mdx`);

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
