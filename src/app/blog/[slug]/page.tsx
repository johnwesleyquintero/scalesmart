import BlogImage from '@/components/blog/blog-image';
import { MDXComponents as mdxComponents } from '@/components/blog/mdx-components';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/mdx';

import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

const DEFAULT_IMAGE_URL = '/default-fallback.svg';
const SITE_URL = 'https://wescode.vercel.app'; // Define site URL constant

/**
 * Generates metadata for the blog post page.
 * Handles both found and not-found states.
 * @param params - The route parameters containing the slug.
 * @returns Metadata object for the page.
 */
export async function generateMetadata({
  params,
}: Readonly<Props>): Promise<Metadata> {
  const { slug } = params;
  const post = await getBlogPostBySlug(slug);

  const NOT_FOUND_TITLE = 'Post Not Found | Wesley Quintero';
  const NOT_FOUND_DESCRIPTION = 'The requested blog post could not be found.';

  if (!post) {
    return {
      title: NOT_FOUND_TITLE,
      description: NOT_FOUND_DESCRIPTION,
      openGraph: {
        title: NOT_FOUND_TITLE,
        description: NOT_FOUND_DESCRIPTION,
        images: [
          {
            url: DEFAULT_IMAGE_URL,
            width: 1200,
            height: 630,
            alt: 'Post Not Found',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: NOT_FOUND_TITLE,
        description: NOT_FOUND_DESCRIPTION,
        images: [DEFAULT_IMAGE_URL],
      },
    };
  }

  const canonicalUrl = new URL(`/blog/${slug}`, SITE_URL).toString();

  return {
    title: `${post.title} | Wesley Quintero`,
    description: post.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: ['Wesley Quintero'],
      tags: post.tags || [],
      url: canonicalUrl,
      images: [
        {
          url: post.image || DEFAULT_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image || DEFAULT_IMAGE_URL],
    },
  };
}

/**
 * Generates static params for all blog posts.
 * Used by Next.js to pre-render pages at build time.
 * @returns An array of objects with the slug parameter for each post.
 */
export async function generateStaticParams() {
  const posts = await getAllBlogPosts();

  return posts.map((post: BlogPost) => ({
    slug: post.slug,
  }));
}

/**
 * Renders a single blog post page.
 * Fetches post data and related posts on the server.
 * @param params - The route parameters containing the slug.
 * @returns JSX element for the blog post page.
 */
export default async function BlogPostPage({ params }: Readonly<Props>) {
  const { slug } = params;
  const post = await getBlogPostBySlug(slug);

  // If post is not found, trigger the Next.js notFound page
  if (!post) {
    notFound();
  }

  // The related posts are already fetched as part of the 'post' object.
  // Access them directly from 'post.relatedPosts'.
  // The type definition for relatedPosts in BlogPost type has been corrected.
  const relatedPosts: BlogPost[] = post.relatedPosts || [];

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <Link
            href="/blog"
            className="flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all articles
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags &&
                post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              {post.readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.readingTime}</span>
                </div>
              )}
            </div>

            {post.image && (
              <div className="mb-8 overflow-hidden rounded-lg">
                <BlogImage
                  src={post.image}
                  alt={post.title}
                  width={1200}
                  height={630}
                  className="w-full object-cover"
                />
              </div>
            )}
          </div>

          {post.content ? (
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <MDXRemote source={post.content} components={mdxComponents} />
            </article>
          ) : (
            <p className="text-muted-foreground italic">
              No content available for this post.
            </p>
          )}

          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-4">Related Articles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedPosts.length > 0 ? (
                relatedPosts.map((relatedPost: BlogPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="font-medium mb-1">{relatedPost.title}</h3>
                    {relatedPost.description && (
                      <p className="text-sm text-muted-foreground">
                        {relatedPost.description}
                      </p>
                    )}
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No related articles found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
