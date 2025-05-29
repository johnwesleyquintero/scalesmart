import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const contentDirectory = path.join(
    process.cwd(),
    'src',
    'app',
    'content',
    'academy',
  );
  const fullPath = path.join(contentDirectory, `${slug}.mdx`);

  try {
    const fileContents = await fs.readFile(fullPath, 'utf8');
    const { content, data } = matter(fileContents);

    const mdxSource = await serialize(content, {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: [],
      },
      scope: data,
    });

    return NextResponse.json({ source: mdxSource, frontmatter: data });
  } catch (error) {
    console.error(`Error fetching MDX content for slug ${slug}:`, error);
    return NextResponse.json(
      { error: 'Could not fetch MDX content' },
      { status: 500 },
    );
  }
}
