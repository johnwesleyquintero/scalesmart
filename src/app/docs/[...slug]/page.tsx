import { getDocPostBySlug, getAllDocPosts } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxDocsComponents } from '@/components/MdxDocsComponents';
import { notFound } from 'next/navigation';
import rehypePrismPlus from 'rehype-prism-plus'; // Explicitly import rehypePrismPlus
import type { Metadata } from 'next'; // Import Metadata type

interface DocPageProps {
  params: {
    slug: string[];
  };
}

// Define default image URL for fallback
const DEFAULT_IMAGE_URL = '/og-image.svg';
const DEFAULT_TITLE_SUFFIX = ' | Wesley Quintero Docs';
const NOT_FOUND_TITLE = 'Documentation Not Found' + DEFAULT_TITLE_SUFFIX;

export async function generateMetadata({
  params,
}: Readonly<DocPageProps>): Promise<Metadata> {
  try {
    const { slug: resolvedSlug } = await params; // Await params directly here
    const doc = await getDocPostBySlug(resolvedSlug.join('/'));

    if (!doc) {
      const NOT_FOUND_DESCRIPTION =
        'The requested documentation could not be found.';
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
              alt: 'Documentation Not Found',
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
      `/docs/${resolvedSlug.join('/')}`,
      'https://wescode.vercel.app',
    ).toString();

    return {
      title: `${doc.title}${DEFAULT_TITLE_SUFFIX}`,
      description: doc.description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: doc.title,
        description: doc.description,
        type: 'article', // Or 'website' if documentation sections are more general
        url: canonicalUrl,
        images: [
          {
            url: doc.image || DEFAULT_IMAGE_URL, // Assume doc.image can be in frontmatter
            width: 1200,
            height: 630,
            alt: doc.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: doc.title,
        description: doc.description,
        images: [doc.image || DEFAULT_IMAGE_URL],
      },
    };
  } catch (error) {
    console.error('Error generating documentation metadata:', error);
    const ERROR_DESCRIPTION =
      'An error occurred while loading this documentation page.';
    return {
      title: 'Error' + DEFAULT_TITLE_SUFFIX,
      description: ERROR_DESCRIPTION,
    };
  }
}

export async function generateStaticParams() {
  const allDocs = await getAllDocPosts();
  return allDocs.map((doc) => ({
    slug: doc.slug.split('/'),
  }));
}

export default async function DocPage({ params }: DocPageProps) {
  const awaitedParams = await params;
  const slugParam = awaitedParams.slug;
  console.log('Resolved slug:', slugParam);
  const doc = await getDocPostBySlug(slugParam.join('/'));

  if (!doc) {
    notFound();
  }

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0">
        <div className="space-y-2">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="text-lg text-muted-foreground">{doc.description}</p>
          )}
        </div>
        <div className="prose dark:prose-invert pb-12 pt-8">
          <MDXRemote
            source={doc.content || ''}
            components={mdxDocsComponents}
            options={{
              mdxOptions: {
                rehypePlugins: [[rehypePrismPlus, { ignoreMissing: true }]],
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
