import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { readFileSync } from 'fs';
import { join } from 'path';
import { components } from '../../../components/MdxRenderer';
import { getAllDocSlugs, getDocBySlug } from '@/lib/docs-data/static-docs';

interface DocPageProps {
  params: {
    slug: string;
  };
}

// Generate static paths from all MDX slugs
export async function generateStaticParams() {
  return getAllDocSlugs();
}

export default async function DocPage({ params }: DocPageProps) {
  // Await params here based on the Next.js 15.3.3 experimental version feedback
  // For stable Next.js versions, `params` is usually directly accessible
  const { slug } = params;

  let content;
  let metadata;

  try {
    // Use getDocBySlug to fetch both content and metadata
    const { content: fetchedContent, data: fetchedData } = getDocBySlug(slug);
    content = fetchedContent;
    metadata = fetchedData;
  } catch (error) {
    console.error(`Failed to fetch doc for slug ${slug}:`, error);
    notFound();
  }

  // Pass the components from MdxRenderer to MDXRemote
  return (
    <div className="prose dark:prose-invert max-w-none">
      {/* Optionally display metadata like title, description */}
      {metadata && <h1>{metadata.title}</h1>}
      {metadata && metadata.description && <p>{metadata.description}</p>}
      <MDXRemote source={content} components={components} key={slug} />
    </div>
  );
}
