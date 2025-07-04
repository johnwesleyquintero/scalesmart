import { BlogSection } from '@/components/blog-section';
import { getAllBlogPosts } from '@/lib/mdx';
import type { BlogPost } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Wesley Quintero',
  description:
    'Insights and strategies for Amazon sellers and e-commerce businesses.',
};

export default async function BlogPage() {
  const blogPosts = await getAllBlogPosts();

  return (
    <section className="container py-8">
      <BlogSection blogPosts={blogPosts} />
    </section>
  );
}
