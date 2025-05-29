import BlogImage from '@/components/blog/blog-image';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import { getAllPosts } from '@/lib/mdx';
import type { BlogPost } from '@/types'; // Import BlogPost type
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

  const blogPosts = posts.filter((post) => post.type === 'blog');
  const articles = posts.filter((post) => post.type === 'article');
  const caseStudies = posts.filter((post) => post.type === 'case-study');

  const renderPostCards = (filteredPosts: BlogPost[]) => (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {filteredPosts.map((post) => (
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
            <CardTitle className="line-clamp-2 text-xl">{post.title}</CardTitle>
            <CardDescription className="line-clamp-3">
              {post.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag: string) => (
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
  );

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold my-6">
            Blogs | Articles | Case Studies
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Sharing insights and strategies for Amazon sellers and e-commerce
            businesses.
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full mt-8">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-center">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="blog">Blog Posts</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="case-study">Case Studies</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {renderPostCards(posts)}
          </TabsContent>
          <TabsContent value="blog" className="space-y-4 mt-4">
            {renderPostCards(blogPosts)}
          </TabsContent>
          <TabsContent value="article" className="space-y-4 mt-4">
            {renderPostCards(articles)}
          </TabsContent>
          <TabsContent value="case-study" className="space-y-4 mt-4">
            {renderPostCards(caseStudies)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
