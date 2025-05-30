import { getAllDocPosts } from '@/lib/mdx';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = await getAllDocPosts();

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
        <ScrollArea className="h-full py-6 pr-6 lg:py-8">
          <div className="flex flex-col space-y-2">
            <h4 className="font-medium">Documentation</h4>
            <Separator className="my-4" />
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {doc.title}
              </Link>
            ))}
          </div>
        </ScrollArea>
      </aside>
      {children}
    </div>
  );
}
