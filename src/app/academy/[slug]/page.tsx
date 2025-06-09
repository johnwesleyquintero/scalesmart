import { getAcademyArticleBySlug, getAllAcademyArticles } from '@/lib/mdx'; // Re-using existing MDX utility for now
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components as mdxComponents } from '@/components/MdxRenderer'; // Renamed to avoid conflict
import Quiz from '@/app/academy/components/Quiz'; // Explicitly import Quiz
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image'; // Import Next.js Image component
import { AcademyProvider } from '@/context/AcademyContext'; // Import AcademyProvider

interface AcademyArticlePageProps {
  params: {
    slug: string;
  };
}

const DEFAULT_IMAGE_URL = '/og-image.svg'; // Use a generic fallback image
const DEFAULT_TITLE_SUFFIX = ' | Wesley Quintero Academy';
const NOT_FOUND_TITLE = 'Article Not Found' + DEFAULT_TITLE_SUFFIX;

export async function generateMetadata({
  params,
}: Readonly<AcademyArticlePageProps>): Promise<Metadata> {
  try {
    const resolvedSlug = params.slug;
    const article = await getAcademyArticleBySlug(resolvedSlug);

    if (!article) {
      const NOT_FOUND_DESCRIPTION =
        'The requested academy article could not be found.';
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
              alt: 'Article Not Found',
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

    const canonicalUrl = new URL(
      `/academy/${resolvedSlug}`,
      'https://wescode.vercel.app',
    ).toString();

    return {
      title: `${article.title}${DEFAULT_TITLE_SUFFIX}`,
      description: article.description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: article.title,
        description: article.description,
        type: 'article',
        publishedTime: article.date,
        authors: ['Wesley Quintero'], // Or pull from article metadata
        tags: article.tags, // Assuming MDX frontmatter has tags
        url: canonicalUrl,
        images: [
          {
            url: article.image || DEFAULT_IMAGE_URL,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.description,
        images: [article.image || DEFAULT_IMAGE_URL],
      },
    };
  } catch (error: unknown) {
    // Use a type guard for better error handling
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(
      `Error generating academy article metadata for slug "${params.slug}":`,
      errorMessage,
      error,
    );

    const ERROR_DESCRIPTION = `An error occurred while loading this academy article: ${errorMessage}`;
    return {
      title: 'Error' + DEFAULT_TITLE_SUFFIX,
      description: ERROR_DESCRIPTION,
      openGraph: {
        title: 'Error' + DEFAULT_TITLE_SUFFIX,
        description: ERROR_DESCRIPTION,
      },
      twitter: {
        title: 'Error' + DEFAULT_TITLE_SUFFIX,
        description: ERROR_DESCRIPTION,
      },
    };
  }
}

interface ArticleSlug {
  slug: string;
}

export async function generateStaticParams() {
  try {
    const articles = await getAllAcademyArticles();
    return articles.map((article: ArticleSlug) => ({
      slug: article.slug,
    }));
  } catch (error: unknown) {
    console.error('Error generating static params:', error);
    return []; // Return an empty array to prevent the build from failing
  }
}

export default async function AcademyArticlePage({
  params,
}: AcademyArticlePageProps) {
  const slugParam = params.slug;

  const article = await getAcademyArticleBySlug(slugParam);

  if (!article) {
    notFound();
  }

  return (
    <AcademyProvider>
      <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-8">
            <Link
              href="/academy"
              className="flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all academy articles
            </Link>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                {article.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{article.date}</span>
                </div>
                {/* Assuming readingTime exists in article frontmatter if desired */}
                {article.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{article.readingTime}</span>
                  </div>
                )}
              </div>

              {article.image && (
                <div className="mb-8 overflow-hidden rounded-lg">
                  <Image
                    src={article.image}
                    alt={article.title}
                    width={1200} // IMPORTANT: Adjust width and height based on actual image aspect ratio and design needs for optimal performance.
                    height={630} // These are placeholders.
                    className="w-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {article.content && (
              <article className="prose prose-lg dark:prose-invert max-w-none">
                <MDXRemote
                  source={article.content}
                  components={{ ...mdxComponents, Quiz }} // Merge components, ensuring Quiz is available
                />
              </article>
            )}

            {/* Consider adding "Related Articles" functionality similar to blog */}
          </div>
        </div>
      </div>
    </AcademyProvider>
  );
}
