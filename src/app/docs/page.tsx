import { getDocPostBySlug } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components } from '@/components/MdxRenderer';
import { notFound } from 'next/navigation';
import { INTRODUCTION_SLUG } from '@/config/docs';

export default async function DocsHomePage() {
  const doc = await getDocPostBySlug(INTRODUCTION_SLUG); // Load the introduction doc by default

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
        <div className="pb-12 pt-8 prose dark:prose-invert max-w-none">
          <MDXRemote source={doc.content || ''} components={components} />
        </div>
      </div>
    </main>
  );
}
