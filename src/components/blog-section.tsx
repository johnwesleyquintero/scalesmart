'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const blogPosts = [
  {
    id: 4,
    title:
      'Getting Started with Amazon FBA: A Comprehensive Guide for Beginners',
    summary:
      'Everything you need to know to start your Amazon FBA journey. From account setup to inventory management and pricing strategies.',
    image: '/images/blog/getting-started-amazon-fba.svg',
    date: 'January 15, 2025',
    tags: ['Amazon FBA', 'Ecommerce', 'Beginners'],
    url: '/blog/getting-started-with-amazon-fba',
  },
  {
    id: 2,
    title:
      'Data Visualization for Amazon Sellers: Turning Numbers into Actionable Insights',
    summary:
      'Learn how to create powerful dashboards that transform your Amazon seller data into clear, actionable insights. Includes step-by-step tutorials and tool recommendations.',
    image: '/images/blog/data-visualization-for-amazon-sellers.svg',
    date: 'February 28, 2025',
    tags: ['Data Visualization', 'Analytics', 'Dashboard Design'],
    url: '/blog/data-visualization-for-amazon-sellers',
  },
  {
    id: 3,
    title: 'Mastering Amazon PPC: Advanced Campaign Structures for 2025',
    summary:
      'Explore cutting-edge PPC campaign structures that maximize ROAS and minimize ACoS. Includes real case studies with before/after results.',
    image: '/images/blog/mastering-amazon-ppc.svg',
    date: 'January 20, 2025',
    tags: ['Amazon PPC', 'Advertising', 'ROAS Optimization'],
    url: '/blog/mastering-amazon-ppc',
  },
  {
    id: 1,
    title: '10 Advanced Amazon SEO Techniques That Actually Work in 2025',
    summary:
      'Discover proven strategies to optimize your Amazon listings for maximum visibility and conversion. Learn how to leverage A9 algorithm updates and keyword research tools.',
    image:
      '/images/blog/10-advanced-amazon-seo-techniques-that-actually-work-in-2025.svg',
    date: 'March 15, 2025',
    tags: ['Amazon SEO', 'A9 Algorithm', 'Keyword Optimization'],
    url: '/blog/10-advanced-amazon-seo-techniques-that-actually-work-in-2025',
  },
  {
    id: 5,
    title:
      'B2B Strategies for Amazon Sellers: Building Profitable Wholesale Relationships',
    summary:
      'A comprehensive guide to establishing and nurturing B2B relationships that fuel your Amazon business growth. Includes negotiation templates and outreach scripts.',
    image: '/images/blog/b2b-strategies-amazon-sellers.svg',
    date: 'November 5, 2024',
    tags: ['B2B', 'Wholesale', 'Supplier Relations'],
    url: '/blog/b2b-amazon-strategies',
  },
  {
    id: 6,
    title: 'Excel Power Tools for Amazon Sellers: Beyond VLOOKUP',
    summary:
      'Advanced Excel techniques that can transform your Amazon business operations. Learn Power Query, DAX formulas, and automation tricks specifically for e-commerce.',
    image: '/images/blog/excel-power-tools-amazon-sellers.svg',
    date: 'October 18, 2024',
    tags: ['Excel', 'Data Analysis', 'Automation'],
    url: '/blog/excel-power-tools',
  },
  {
    id: 7,
    title: 'Next.js Metadata API Guide',
    summary: 'A guide to using the Next.js Metadata API.',
    image: '/images/blog/next-js-metadata-api-guide.svg',
    date: 'April 16, 2025',
    tags: ['Next.js', 'Metadata API'],
    url: '/blog/next-js-metadata-api-guide',
  },
  {
    id: 8,
    title: 'Amazon Seller Tools',
    summary: 'A guide to using Amazon Seller Tools.',
    image: '/images/blog/Amazon Seller Tools Suite.svg',
    date: 'April 16, 2025',
    tags: ['Amazon', 'Seller Tools'],
    url: '/blog/amazon-seller-tools',
  },
];

export default function BlogSection() {
  console.log('BlogSection rendered');
  return (
    <section id="blog" className="bg-muted/30 py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Blog &amp; Articles</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sharing insights and strategies for Amazon sellers and e-commerce
            businesses.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.slice(0, 6).map((post) => (
            <Card
              key={post.id}
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
                  <Calendar className="h-4 w-4" />
                  <span>{post.date}</span>
                </div>
                <CardTitle className="line-clamp-2 text-lg">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  asChild
                  variant="ghost"
                  className="p-0 hover:bg-transparent group"
                >
                  <Link
                    href={post.url}
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
