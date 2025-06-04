import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import matter from 'gray-matter';
import { handleApiError } from '@/lib/api-error-handler';

const staticContentDirectory = path.join(process.cwd(), 'src/app/content/static');

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const fullPath = path.join(staticContentDirectory, `${slug}.mdx`);

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    // You can add more robust validation for frontmatter here if needed
    return NextResponse.json({ source: { compiledSource: content }, frontmatter: data });
  } catch (error) {
    console.error(`Error reading static MDX file for slug ${slug}:`, error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}