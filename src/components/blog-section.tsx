'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import type { BlogPost } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CalendarDays,
  Search,
  LayoutGrid,
  List,
  Clock,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'default' | 'newest' | 'oldest' | 'a-z';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('default');

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
      const currentSearch = searchParams?.toString() || '';

      // Prevent infinite loop by only replacing if the URL actually needs to change
      if (search === currentSearch) return;

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

  // Sort the filtered posts
  const sortedFilteredPosts = useMemo(() => {
    const posts = [...filteredPosts];
    if (sortOption === 'newest') {
      posts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortOption === 'oldest') {
      posts.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    } else if (sortOption === 'a-z') {
      posts.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'default' uses the original sorting from getAllBlogPosts
    return posts;
  }, [filteredPosts, sortOption]);

  // Handle limiting vs pagination
  const displayedPosts = limit
    ? sortedFilteredPosts.slice(0, limit)
    : sortedFilteredPosts.slice(0, visibleCount);

  const hasMorePosts = !limit && visibleCount < sortedFilteredPosts.length;

  return (
    <section id="blog" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50 blur-3xl" />
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent pb-2">
            Insights & Strategies
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground/90">
            Thoughts, playbooks, and systems for scaling Amazon brands and
            e-commerce operations.
          </p>
        </div>

        {/* Search and Filter Section */}
        {isBlogPage && (
          <div className="mb-10 space-y-6">
            <div className="relative max-w-2xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-10 w-full bg-background"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <Select
                value={sortOption}
                onValueChange={(val) => setSortOption(val as SortOption)}
              >
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" label="Default">
                    Default
                  </SelectItem>
                  <SelectItem value="newest" label="Newest">
                    Newest
                  </SelectItem>
                  <SelectItem value="oldest" label="Oldest">
                    Oldest
                  </SelectItem>
                  <SelectItem value="a-z" label="A-Z">
                    A-Z
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md overflow-hidden bg-background">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none h-10 w-10"
                  aria-label="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none h-10 w-10"
                  aria-label="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="relative w-full max-w-4xl mx-auto group/tags">
                {/* Fade gradients to indicate scrollability */}
                <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <div className="flex overflow-x-auto pb-4 gap-2 snap-x snap-mandatory w-full px-4 scroll-smooth scrollbar-thin">
                  <Badge
                    variant={selectedTag === null ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all duration-300 px-4 py-1.5 text-sm whitespace-nowrap snap-start shadow-sm ${
                      selectedTag === null
                        ? 'bg-primary text-primary-foreground scale-105'
                        : 'hover:bg-primary/10 hover:border-primary/50'
                    }`}
                    onClick={() => handleTagClick(null)}
                  >
                    All
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all duration-300 px-4 py-1.5 text-sm whitespace-nowrap snap-start shadow-sm ${
                        selectedTag === tag
                          ? 'bg-primary text-primary-foreground scale-105'
                          : 'hover:bg-primary/10 hover:border-primary/50'
                      }`}
                      onClick={() =>
                        handleTagClick(selectedTag === tag ? null : tag)
                      }
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                {/* Fade edges to hint at scrollable content on mobile */}
                <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
                <div className="absolute top-0 left-0 bottom-4 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden" />
              </div>
            )}
          </div>
        )}

        {displayedPosts.length > 0 ? (
          <div
            className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}
          >
            {displayedPosts.map((post, index) => (
              <Card
                key={post.slug}
                className={`overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 group border-muted/50 hover:border-primary/50 relative animate-in fade-in slide-in-from-bottom-8 fill-mode-both ${
                  viewMode === 'list'
                    ? 'flex flex-col sm:flex-row items-stretch'
                    : 'flex flex-col'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="absolute inset-0 z-10"
                >
                  <span className="sr-only">Read {post.title}</span>
                </Link>
                <div
                  className={`relative overflow-hidden ${viewMode === 'list' ? 'sm:w-2/5 aspect-video sm:aspect-auto sm:min-h-full shrink-0 border-r border-muted/50' : 'aspect-video'}`}
                >
                  <OptimizedImage
                    src={post.image || '/default-fallback.svg'}
                    alt={post.title}
                    width={800}
                    height={400}
                    className="object-cover transition-transform duration-300 group-hover:scale-105 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div
                  className={`flex flex-col flex-1 ${viewMode === 'list' ? 'p-2' : ''}`}
                >
                  <CardHeader className={viewMode === 'list' ? 'p-4' : 'p-4'}>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        <span>{post.date}</span>
                      </div>
                      {post.readingTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{post.readingTime}</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2 text-lg">
                      {post.title}
                    </CardTitle>
                    <CardDescription
                      className={
                        viewMode === 'list'
                          ? 'line-clamp-3 mt-2'
                          : 'line-clamp-2'
                      }
                    >
                      {post.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {(post.tags ?? []).slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs bg-secondary/50 hover:bg-secondary/80 transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(post.tags?.length ?? 0) > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-dashed text-muted-foreground"
                        >
                          +{(post.tags?.length ?? 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 mt-auto">
                    <div className="flex items-center text-primary font-medium group-hover:underline">
                      Read Article{' '}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardFooter>
                </div>
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
