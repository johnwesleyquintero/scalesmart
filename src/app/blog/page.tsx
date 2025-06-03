import BlogListingClient from '@/components/blog/blog-listing-client';
import { getAllBlogPosts } from '@/lib/mdx';
import type { BlogPost } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Wesley Quintero',
  description:
    'Insights and strategies for Amazon sellers and e-commerce businesses.',
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return <BlogListingClient initialPosts={posts} />;
}
