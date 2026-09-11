import React from 'react';
import Link from 'next/link';
import { LessonContent, LessonMeta } from '@/lib/academy-mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { ArrowLeft, ArrowRight, Clock, Lightbulb, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Academy-specific MDX component overrides ─────────────────────────────────

/**
 * Custom MDX components for Academy lessons — adds styled callout blocks
 * for OperatorNote, Scenario, and ConceptBox, layered on top of the base
 * prose styles.
 */
const academyMdxComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-10 mb-4 text-xl sm:text-2xl font-extrabold tracking-tight text-foreground border-b border-border/60 pb-3"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mt-8 mb-3 text-lg font-bold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-7 mb-4 text-sm sm:text-base text-foreground/90" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-4 ml-6 space-y-1.5 list-disc text-sm sm:text-base text-foreground/90" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-4 ml-6 space-y-1.5 list-decimal text-sm sm:text-base text-foreground/90" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-5 border-l-4 border-amber-500 pl-5 py-1 bg-amber-500/5 rounded-r-xl italic text-foreground/80 text-sm"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full border-collapse text-xs sm:text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted/60" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-4 py-2.5 text-left text-foreground/85 border-b border-border/40 last:border-0"
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="even:bg-muted/30 hover:bg-muted/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code
          className={cn('block font-mono text-xs leading-relaxed text-emerald-400', className)}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.15rem] font-mono text-xs text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-5 overflow-x-auto rounded-xl border border-border/60 bg-slate-950 px-5 py-4 text-xs leading-relaxed"
      {...props}
    >
      {children}
    </pre>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  hr: ({ ...props }) => <hr className="my-8 border-border/40" {...props} />,
};

// ─── Lesson Reader Component ───────────────────────────────────────────────────

interface LessonReaderProps {
  lesson: LessonContent;
  prevLesson: LessonMeta | null;
  nextLesson: LessonMeta | null;
  courseSlug: string;
}

export default function LessonReader({
  lesson,
  prevLesson,
  nextLesson,
  courseSlug,
}: LessonReaderProps) {
  return (
    <article className="flex-1 min-w-0 max-w-3xl">
      {/* Lesson Header */}
      <div className="mb-8 pb-6 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/60 uppercase tracking-wider">
            Lesson {lesson.lessonNumber}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {lesson.level}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <Clock className="h-3.5 w-3.5" />
            {lesson.duration}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-3">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {lesson.description}
          </p>
        )}

        {/* Operator Note highlight at top of lesson */}
        {lesson.operatorNote && (
          <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                Coach Wesley&apos;s Operator Note
              </div>
              <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed italic">
                &ldquo;{lesson.operatorNote}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MDX Content Body */}
      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
        <MDXRemote
          source={lesson.content}
          components={academyMdxComponents as Parameters<typeof MDXRemote>[0]['components']}
        />
      </div>

      {/* Lesson Footer Navigation */}
      <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {prevLesson ? (
          <Button
            asChild
            variant="outline"
            className="flex-1 sm:flex-none justify-start rounded-xl border-border/80 font-medium h-auto py-3 px-5"
          >
            <Link href={`/academy/courses/${courseSlug}/${prevLesson.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Previous
                </div>
                <div className="text-xs sm:text-sm font-semibold truncate max-w-[180px]">
                  {prevLesson.title}
                </div>
              </div>
            </Link>
          </Button>
        ) : (
          <div className="flex-1 sm:flex-none" />
        )}

        {nextLesson ? (
          <Button
            asChild
            className="flex-1 sm:flex-none justify-end bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-auto py-3 px-5 transition-all hover:scale-[1.01]"
          >
            <Link href={`/academy/courses/${courseSlug}/${nextLesson.slug}`}>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Next Lesson
                </div>
                <div className="text-xs sm:text-sm font-semibold truncate max-w-[180px]">
                  {nextLesson.title}
                </div>
              </div>
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            className="flex-1 sm:flex-none justify-end bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-auto py-3 px-5"
          >
            <Link href={`/academy/courses/${courseSlug}/scenario-lab`}>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  You&apos;ve completed all lessons!
                </div>
                <div className="text-xs sm:text-sm font-semibold">
                  Start Scenario Lab →
                </div>
              </div>
              <Zap className="ml-2 h-4 w-4 shrink-0" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
