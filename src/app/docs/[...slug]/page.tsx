import { getDocPostBySlug } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components } from '@/components/MdxRenderer';
import { notFound } from 'next/navigation';
import rehypePrismPlus from 'rehype-prism-plus';

interface DocPageProps {
  params: {
    slug: string[];
  };
}

export async function generateStaticParams() {
  // Logic to get all slugs for doc posts (omitted for brevity)
  return [];
}

export default async function DocPage({ params }: DocPageProps) {
  const doc = await getDocPostBySlug(params.slug.join('/'));

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
        <div className="pb-12 pt-8">
          <MDXRemote
            source={doc.content || ''}
            components={components}
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
