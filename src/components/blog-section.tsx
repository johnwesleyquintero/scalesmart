'use client';

import type { BlogPost } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CalendarDays } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';

export function BlogSection({
  blogPosts,
  limit,
}: {
  blogPosts: BlogPost[];
  limit?: number;
}) {
  const displayedPosts = limit ? blogPosts.slice(0, limit) : blogPosts;
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedPosts.map((post) => (
            <Card
              key={post.slug}
              className="overflow-hidden transition-all duration-300 hover:shadow-lg group hover:border-primary"
            >
              <div className="aspect-video overflow-hidden relative">
                <Image
                  src={post.image || '/default-fallback.svg'}
                  alt={post.title}
                  width={800}
                  height={400}
                  quality={75}
                  loading="lazy"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                <Button asChild variant="ghost">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex items-center text-primary group-hover:underline"
                  >
                    Read Article{' '}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/blog">
              View All Articles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
