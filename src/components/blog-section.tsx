'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import type { BlogPost } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import OptimizedImage from './shared/optimized-image';
import { Button } from './ui/button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

// Custom debounce hook to delay search filtering
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function BlogSectionContent({
  blogPosts,
  limit,
}: {
  blogPosts: BlogPost[];
  limit?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBlogPage = pathname === '/blog';

  // Initialize state from URL if on the blog page
  const initialSearch =
    isBlogPage && searchParams ? searchParams.get('q') || '' : '';
  const initialTag =
    isBlogPage && searchParams ? searchParams.get('tag') || null : null;

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);
  const [visibleCount, setVisibleCount] = useState(limit || 9); // Display 9 items initially

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sync state to URL when filters change
  const updateUrl = useCallback(
    (q: string, tag: string | null) => {
      if (!isBlogPage) return;
      const params = new URLSearchParams(searchParams?.toString() || '');

      if (q) params.set('q', q);
      else params.delete('q');

      if (tag) params.set('tag', tag);
      else params.delete('tag');

      const search = params.toString();
      const query = search ? `?${search}` : '';

      // Update URL without a full page reload or scrolling
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [isBlogPage, pathname, router, searchParams],
  );

  // Trigger URL sync
  useEffect(() => {
    updateUrl(debouncedSearchQuery, selectedTag);
  }, [debouncedSearchQuery, selectedTag, updateUrl]);

  // Handlers to also reset pagination when a filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!limit) setVisibleCount(9);
  };

  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
    if (!limit) setVisibleCount(9);
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogPosts.forEach((post) => {
      post.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [blogPosts]);

  // Filter posts based on search and tag
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesSearch =
        debouncedSearchQuery === '' ||
        post.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        post.description
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());

      const matchesTag =
        selectedTag === null || (post.tags && post.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [blogPosts, debouncedSearchQuery, selectedTag]);

  // Handle limiting vs pagination
  const displayedPosts = limit
    ? filteredPosts.slice(0, limit)
    : filteredPosts.slice(0, visibleCount);

  const hasMorePosts = !limit && visibleCount < filteredPosts.length;

  return (
    <section id="blog" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Blog & Articles</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sharing insights and strategies for Amazon sellers and e-commerce
            businesses.
          </p>
        </div>

        {/* Search and Filter Section */}
        {isBlogPage && (
          <div className="mb-10 space-y-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-10 w-full bg-background"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <Badge
                  variant={selectedTag === null ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1 text-sm"
                  onClick={() => handleTagClick(null)}
                >
                  All
                </Badge>
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1 text-sm"
                    onClick={() =>
                      handleTagClick(selectedTag === tag ? null : tag)
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {displayedPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedPosts.map((post) => (
              <Card
                key={post.slug}
                className="overflow-hidden transition-all duration-300 hover:shadow-lg group hover:border-primary relative"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="absolute inset-0 z-10"
                >
                  <span className="sr-only">Read {post.title}</span>
                </Link>
                <div className="aspect-video overflow-hidden relative">
                  <OptimizedImage
                    src={post.image || '/default-fallback.svg'}
                    alt={post.title}
                    width={800}
                    height={400}
                    className="object-cover transition-transform duration-300 group-hover:scale-105 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardHeader className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {(post.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="flex items-center text-primary font-medium group-hover:underline">
                    Read Article{' '}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
            <p>No articles found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag(null);
              }}
            >
              Clear Search & Filters
            </Button>
          </div>
        )}

        {/* Load More Button */}
        {hasMorePosts && (
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount((prev) => prev + 9)}
            >
              Load More Articles
            </Button>
          </div>
        )}

        {!isBlogPage && (
          <div className="mt-12 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/blog">
                View All Articles <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// Wrapper to provide Suspense boundary for useSearchParams
export function BlogSection(props: { blogPosts: BlogPost[]; limit?: number }) {
  return (
    <Suspense
      fallback={
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto mb-4" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse mx-auto mb-12" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-72 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </section>
      }
    >
      <BlogSectionContent {...props} />
    </Suspense>
  );
}
