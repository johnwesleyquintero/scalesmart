'use client';

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
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Assuming BlogImage component exists in '@/components/blog/blog-image'
import BlogImage from '@/components/blog/blog-image';

interface BlogListingClientProps {
  initialPosts: BlogPost[];
}

const POSTS_PER_LOAD = 6;

export default function BlogListingClient({
  initialPosts,
}: BlogListingClientProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedPosts, setDisplayedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('dateDesc'); // 'dateDesc', 'dateAsc', 'titleAsc', 'titleDesc'

  // Memoize filtered, searched, and sorted posts
  const filteredAndSearchedAndSortedPosts = useMemo(() => {
    let posts = initialPosts;

    // Filter by tab
    switch (activeTab) {
      case 'blog':
        posts = posts.filter((post: BlogPost) => post.type === 'blog');
        break;
      case 'article':
        posts = posts.filter((post: BlogPost) => post.type === 'article');
        break;
      case 'case-study':
        posts = posts.filter((post: BlogPost) => post.type === 'case-study');
        break;
      default:
        // 'all' tab, no type filtering
        break;
    }

    // Filter by search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(lowerCaseQuery) ||
          post.description.toLowerCase().includes(lowerCaseQuery) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(lowerCaseQuery)),
      );
    }

    // Sort posts - Use slice() to avoid mutating the original array
    const sortedPosts = posts.slice().sort((a, b) => {
      switch (sortBy) {
        case 'dateAsc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'titleDesc':
          return b.title.localeCompare(a.title);
        case 'dateDesc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return sortedPosts;
  }, [initialPosts, activeTab, searchQuery, sortBy]);

  // Effect to load the first batch of posts whenever filters/sort change
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading delay
    const timer = setTimeout(() => {
      setDisplayedPosts(
        filteredAndSearchedAndSortedPosts.slice(0, POSTS_PER_LOAD),
      );
      setHasMore(filteredAndSearchedAndSortedPosts.length > POSTS_PER_LOAD);
      setIsLoading(false);
    }, 500); // Simulate 0.5 second load time

    // Cleanup timeout on effect cleanup or re-run
    return () => clearTimeout(timer);
  }, [filteredAndSearchedAndSortedPosts]); // Dependency on the filtered/sorted list

  // Function to load more posts
  const handleLoadMore = useCallback(() => {
    setIsLoading(true);
    const currentLength = displayedPosts.length;
    const nextPosts = filteredAndSearchedAndSortedPosts.slice(
      currentLength,
      currentLength + POSTS_PER_LOAD,
    );

    // Simulate loading delay
    setTimeout(() => {
      setDisplayedPosts((prev) => [...prev, ...nextPosts]);
      setIsLoading(false);
      setHasMore(
        filteredAndSearchedAndSortedPosts.length >
          currentLength + nextPosts.length,
      );
    }, 500); // Simulate 0.5 second load time
  }, [displayedPosts.length, filteredAndSearchedAndSortedPosts]); // Dependencies: current displayed count and the full filtered/sorted list

  const renderPostCards = (postsToRender: BlogPost[]) => {
    const showNoResults =
      postsToRender.length === 0 &&
      !isLoading &&
      filteredAndSearchedAndSortedPosts.length === 0; // Only show if the *filtered* list is empty

    if (showNoResults) {
      return (
        <p className="text-center text-muted-foreground col-span-full">
          No posts found matching your criteria.
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
              {/* Consider using Next.js Image component for optimization */}
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

        {/* Skeletons for loading state */}
        {isLoading &&
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

        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center">
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateDesc">Newest First</SelectItem>
              <SelectItem value="dateAsc">Oldest First</SelectItem>
              <SelectItem value="titleAsc">Title (A-Z)</SelectItem>
              <SelectItem value="titleDesc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs
          defaultValue="all"
          className="w-full mt-8"
          onValueChange={(value) => {
            setActiveTab(value);
            setSearchQuery(''); // Reset search query when changing tabs
          }}
        >
          {/* TabsList outside TabsContent */}
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

          {/* Content for each tab */}
          <TabsContent value="all" className="space-y-4 mt-4">
            {renderPostCards(displayedPosts)}
          </TabsContent>
          <TabsContent value="blog" className="space-y-4 mt-4">
            {/* Re-render same content based on displayedPosts */}
            {renderPostCards(displayedPosts)}
          </TabsContent>
          <TabsContent value="article" className="space-y-4 mt-4">
            {/* Re-render same content based on displayedPosts */}
            {renderPostCards(displayedPosts)}
          </TabsContent>
          <TabsContent value="case-study" className="space-y-4 mt-4">
            {/* Re-render same content based on displayedPosts */}
            {renderPostCards(displayedPosts)}
          </TabsContent>
        </Tabs>

        {/* Load More button */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? 'Loading More...' : 'Load More'}
            </Button>
          </div>
        )}

        {/* Optional: Message when all results are loaded */}
        {!hasMore && !isLoading && displayedPosts.length > 0 && (
          <div className="text-center text-muted-foreground mt-8">
            You&apos;ve reached the end of the list.
          </div>
        )}
      </div>
    </div>
  );
}
