import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import fs from 'fs';
import Link from 'next/link';
import path from 'path';

const blogDirectory = path.join(process.cwd(), 'src/app/content/blog');

async function getBlogPosts() {
  const fileNames = fs.readdirSync(blogDirectory);

  return fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, '');
    return {
      slug,
      title: slug.replace(/[-]/g, ' '), // Replace dashes with spaces for title
    };
  });
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();

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
      <h1>Amazon Seller Academy Blog</h1>
      <ul>
        {blogPosts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
