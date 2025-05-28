import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import matter from 'gray-matter';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

const academyDirectory = path.join(process.cwd(), 'src/app/content/academy');

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const fullPath = path.join(academyDirectory, `${slug}.mdx`);

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const keywords = data.keywords as string[];
    return NextResponse.json({ content, keywords });
  } catch (error) {
    console.error('Error reading MDX file:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
