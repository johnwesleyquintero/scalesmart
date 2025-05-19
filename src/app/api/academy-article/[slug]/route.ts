import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const academyDirectory = path.join(process.cwd(), 'src/app/content/academy');

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const fullPath = path.join(academyDirectory, `${slug}.mdx`);

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return NextResponse.json({ content: fileContents });
  } catch (error) {
    console.error('Error reading MDX file:', error);
    return NextResponse.json(
      { error: 'Failed to load article' },
      { status: 500 },
    );
  }
}
