import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import fs from 'fs';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import path from 'path';

const blogDirectory = path.join(process.cwd(), 'src/app/content/blog');

async function getBlogPost(slug: string) {
  try {
    const filePath = path.join(blogDirectory, `${slug}.mdx`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const mdxSource = await serialize(fileContent);
    return mdxSource;
  } catch (error) {
    console.error(`Error getting blog post ${slug}:`, error);
    return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const mdxSource = await getBlogPost(slug);

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {mdxSource ? <MDXRemote {...mdxSource} /> : <p>Blog post not found.</p>}
    </div>
  );
}
