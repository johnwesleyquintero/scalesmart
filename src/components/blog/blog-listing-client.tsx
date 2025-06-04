'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BlogPost } from '@/types';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogListingClientProps {
  initialPosts: BlogPost[];
}

const POSTS_PER_LOAD = 6;

export default function BlogListingClient({
  initialPosts,
}: BlogListingClientProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [displayedPosts, setDisplayedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const getFilteredPosts = useCallback(() => {
    switch (activeTab) {
      case 'blog':
        return initialPosts.filter((post: BlogPost) => post.type === 'blog');
      case 'article':
        return initialPosts.filter((post: BlogPost) => post.type === 'article');
      case 'case-study':
        return initialPosts.filter(
          (post: BlogPost) => post.type === 'case-study',
        );
      default:
        return initialPosts;
    }
  }, [initialPosts, activeTab]);

  useEffect(() => {
    // Reset displayed posts and hasMore when tab changes
    setDisplayedPosts([]);
    setHasMore(true);
    setIsLoading(false); // Ensure loading is reset
    loadMorePosts(0, getFilteredPosts());
  }, [activeTab, getFilteredPosts]);

  const loadMorePosts = useCallback(
    (currentLength: number, postsToFilter: BlogPost[]) => {
      setIsLoading(true);
      const nextPosts = postsToFilter.slice(
        currentLength,
        currentLength + POSTS_PER_LOAD,
      );

      // Use a timeout to simulate network delay for better UX
      setTimeout(() => {
        setDisplayedPosts((prev) => [...prev, ...nextPosts]);
        setIsLoading(false);
        setHasMore(postsToFilter.length > currentLength + nextPosts.length);
      }, 500); // Simulate 0.5 second load time
    },
    [],
  );

  const handleLoadMore = () => {
    loadMorePosts(displayedPosts.length, getFilteredPosts());
  };

  const renderPostCards = (postsToRender: BlogPost[]) => {
    if (postsToRender.length === 0 && !isLoading) {
      return (
        <p className="text-center text-muted-foreground col-span-full">
          No posts found for this category.
        </p>
      );
    }
    return (
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {postsToRender.map((post) => (
          <Card
            key={post.slug}
            className="overflow-hidden transition-all duration-300 hover:shadow-lg bg-card text-foreground"
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
        {isLoading &&
          // Skeletons for loading state
          Array.from({ length: POSTS_PER_LOAD }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardHeader className="p-4">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-4 w-24" />
              </CardFooter>
            </Card>
          ))}
      </div>
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold my-6 text-foreground">
            Blogs | Articles | Case Studies
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Sharing insights and strategies for Amazon sellers and e-commerce
            businesses.
          </p>
        </div>

        <Tabs
          defaultValue="all"
          className="w-full mt-8"
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4 flex flex-wrap h-auto justify-center bg-muted">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              All Posts
            </TabsTrigger>
            <TabsTrigger
              value="blog"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Blog Posts
            </TabsTrigger>
            <TabsTrigger
              value="article"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Articles
            </TabsTrigger>
            <TabsTrigger
              value="case-study"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Case Studies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {renderPostCards(displayedPosts)}
          </TabsContent>
          <TabsContent value="blog" className="space-y-4 mt-4">
            {renderPostCards(displayedPosts)}
          </TabsContent>
          <TabsContent value="article" className="space-y-4 mt-4">
            {renderPostCards(displayedPosts)}
          </TabsContent>
          <TabsContent value="case-study" className="space-y-4 mt-4">
            {renderPostCards(displayedPosts)}
          </TabsContent>
        </Tabs>

        {hasMore && (
          <div className="text-center mt-8">
            <Button onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? 'Loading More...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
