import { getDocPostBySlug, getAllDocPosts } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components } from '@/components/MdxRenderer';
import { notFound } from 'next/navigation';
import { INTRODUCTION_SLUG } from '@/config/docs';
import Link from 'next/link';

export default async function DocsHomePage() {
  const doc = await getDocPostBySlug(INTRODUCTION_SLUG); // Load the introduction doc by default
  const allDocs = await getAllDocPosts(); // Fetch all documentation posts

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

        {/* Display a list of all documentation pages */}
        <div className="mt-12">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            All Documentation
          </h2>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            {allDocs.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/docs/${d.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
