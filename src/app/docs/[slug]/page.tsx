import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components } from '../../../components/MdxRenderer';
import {
  getAllDocSlugs,
  getDocBySlug,
} from '../../../lib/docs-data/static-docs';
import {
  getHeadingsFromMdx,
  Heading,
} from '../../../lib/docs-data/get-headings';
import { HeadingsSetter } from './HeadingsSetter'; // Import HeadingsSetter
import { ClientHeadingsSetterWrapper } from './ClientHeadingsSetterWrapper'; // Import the new wrapper

interface DocMetadata {
  title?: string;
  description?: string;
  [key: string]: unknown; // Allow for other properties if they exist
}

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
  const { slug } = params;

  let content: string;
  let metadata: DocMetadata;
  let headings: Heading[] = [];

  try {
    const { content: fetchedContent, data: fetchedData } = getDocBySlug(slug);
    content = fetchedContent;
    metadata = fetchedData;
    headings = await getHeadingsFromMdx(content);
  } catch (error) {
    console.error(
      `Failed to fetch doc or extract headings for slug ${slug}:`,
      error,
    );
    notFound();
  }

  return (
    <>
      <ClientHeadingsSetterWrapper headings={headings} />{' '}
      {/* Wrap HeadingsSetter in a client component */}
      <div className="dark:prose-invert max-w-none">
        {/* Optionally display metadata like title, description */}
        {metadata && <h1>{metadata.title}</h1>}
        {metadata && metadata.description && <p>{metadata.description}</p>}
        <MDXRemote source={content} components={components} key={slug} />
      </div>
    </>
  );
}
