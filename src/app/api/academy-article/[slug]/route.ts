import fs from 'fs';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { NextResponse } from 'next/server';
import path from 'path';

// Define the directory where your MDX blog/article content is stored
const articlesDirectory = path.join(
  process.cwd(),
  'src',
  'app',
  'content',
  'blog',
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const fullPath = path.join(articlesDirectory, `${slug}.mdx`);
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { content, data: frontmatter } = matter(fileContents);
    const mdxSource = await serialize(content, {
      parseFrontmatter: false, // We already parsed it with gray-matter
      mdxOptions: {
        // Add any remark/rehype plugins here if needed in the future
        // remarkPlugins: [],
        // rehypePlugins: [],
      },
      scope: frontmatter, // Makes frontmatter available in the MDX content if you use it there
    });
    return NextResponse.json({
      source: mdxSource,
      frontmatter: { ...frontmatter, courseId: frontmatter.courseId || null },
    });
  } catch (error) {
    console.error(`Error loading MDX module for slug "${slug}":`, error);
    return NextResponse.json(
      { error: `Article content for "${slug}" not found or processing error.` },
      { status: 404 },
    );
  }
}
