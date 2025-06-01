import { getDocPostBySlug, getAllDocPosts } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components } from '@/components/MdxRenderer';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DocPageProps {
  params: {
    slug: string[]; // For [...slug] routes, params.slug is always an array
  };
}

const DOCUMENTATION_BASE_URL = 'https://wescode.vercel.app/'; // Replace with your actual domain

const DEFAULT_TITLE_SUFFIX = ' | ScaleSmart Docs'; // Customize as needed
const DEFAULT_DOC_DESCRIPTION = 'Documentation page';
const NOT_FOUND_TITLE = 'Document Not Found' + DEFAULT_TITLE_SUFFIX;
const DEFAULT_OG_IMAGE_URL = '/og-image.svg'; // Replace with your default OG image

export async function generateMetadata(
  props: Readonly<DocPageProps>,
): Promise<Metadata> {
  const { params } = props;
  const slug = params.slug.join('/');
  try {
    const doc = await getDocPostBySlug(slug);

    if (!doc) {
      const NOT_FOUND_DESCRIPTION =
        'The requested document could not be found.';
      return {
        title: NOT_FOUND_TITLE,
        description: NOT_FOUND_DESCRIPTION,
        openGraph: {
          title: NOT_FOUND_TITLE,
          description: NOT_FOUND_DESCRIPTION,
          images: [{ url: DEFAULT_OG_IMAGE_URL }],
        },
      };
    }

    const canonicalUrl = new URL(
      `/docs/${slug}`,
      DOCUMENTATION_BASE_URL,
    ).toString();

    const pageTitleSuffix = `${doc.title}${DEFAULT_TITLE_SUFFIX}`;

    return {
      title: pageTitleSuffix,
      description: doc.description || DEFAULT_DOC_DESCRIPTION,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: doc.title,
        description: doc.description || DEFAULT_DOC_DESCRIPTION,
        type: 'article',
        url: canonicalUrl,
        images: [{ url: doc.image || DEFAULT_OG_IMAGE_URL }],
      },
      twitter: {
        card: 'summary_large_image',
        title: doc.title,
        description: doc.description || DEFAULT_DOC_DESCRIPTION,
        images: [doc.image || DEFAULT_OG_IMAGE_URL],
      },
    };
  } catch (error) {
    console.error('Error generating doc metadata:', error);
    return {
      title: 'Error' + DEFAULT_TITLE_SUFFIX,
      description: 'An error occurred while loading this document.',
    };
  }
}

export async function generateStaticParams() {
  const docs = await getAllDocPosts();
  return docs.map((doc) => ({
    slug: doc.slug.split('/'), // Split slug into array for catch-all route
  }));
}

export default async function DocPage(props: DocPageProps) {
  const { params } = props;
  const slug = params.slug.join('/');
  const doc = await getDocPostBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0">
        <div className="mb-4">
          <Link
            href="/docs"
            className="flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documentation
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="text-lg text-muted-foreground">{doc.description}</p>
          )}
        </div>
        <div className="pb-12 pt-8 prose dark:prose-invert max-w-none">
          <MDXRemote source={doc.content || ''} components={components} />
        </div>
      </div>
    </main>
  );
}
