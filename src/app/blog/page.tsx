import { BlogImage } from '@/components/blog/BlogImage';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAllPosts } from '@/lib/mdx';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog | Wesley Quintero',
  description:
    'Insights and strategies for Amazon sellers and e-commerce businesses.',
};

export default async function BlogPage() {
  console.time('BlogPage');
  console.time('getAllPosts');
  const posts = await getAllPosts();
  console.timeEnd('getAllPosts');
  console.timeEnd('BlogPage');

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Page Title Section */}
        <div className="text-center">
          {' '}
          {/* Optional: remove mb-12 if my-6 on h1 is sufficient */}{' '}
          {/* Removed extra space */}
          <h1 className="text-3xl font-bold my-6">Blog & Articles</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            {' '}
            {/* Consider if mt-4 is still needed or if my-6 handles it */}
            Sharing insights and strategies for Amazon sellers and e-commerce
            businesses.
          </p>
        </div>
        {/* Removed mx-auto max-w-2xl from the paragraph */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card
              key={post.slug}
              className="overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <div className="aspect-video overflow-hidden">
                <BlogImage
                  src={post.image || '/placeholder.svg?height=400&width=600'}
                  alt={post.title}
                  width={600}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardHeader className="p-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                <CardTitle className="line-clamp-2 text-xl">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex items-center text-primary hover:underline"
                >
                  Read Article <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
