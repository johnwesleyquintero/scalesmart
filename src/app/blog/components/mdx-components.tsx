import { BlogPost } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type React from 'react';
import BlogImage from './blog-image';
import { mdxTableComponents } from '@/components/mdx/MdxTable';

export const MDXComponents = {
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className={cn('mt-8 mb-4 text-3xl font-bold tracking-tight', className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn('mt-8 mb-4 text-2xl font-bold tracking-tight', className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className={cn('mt-8 mb-4 text-xl font-bold tracking-tight', className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className={cn('mt-8 mb-4 text-lg font-bold tracking-tight', className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('leading-7 mb-4', className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn('my-6 ml-6 list-disc', className)} {...props} />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn('my-6 ml-6 list-decimal', className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn('mt-2', className)} {...props} />
  ),
  blockquote: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn('mt-6 border-l-2 border-primary pl-6 italic', className)}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    src,
    width,
    height,
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <BlogImage
      className={className}
      src={src as string}
      alt={alt || ''}
      width={width as number}
      height={height as number}
    />
  ),
  hr: ({ ...props }) => (
    <hr className="my-8 border-muted-foreground/20" {...props} />
  ),
  ...mdxTableComponents,
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className={cn(
        'mb-4 mt-6 overflow-x-auto rounded-lg border bg-black py-4',
        className,
      )}
      {...props}
    />
  ),
  strong: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className={cn('font-bold', className)} {...props} />
  ),
  a: ({
    className,
    href = '#',
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href.startsWith('/');
    if (isInternal) {
      return (
        <Link
          href={href}
          className={cn(
            'font-medium underline underline-offset-4 text-primary',
            className,
          )}
          {...props}
        />
      );
    }
    return (
      <a
        href={href}
        className={cn(
          'font-medium underline underline-offset-4 text-primary',
          className,
        )}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
  Image: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => (
    <BlogImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
  wrapper: ({ children }: { children: React.ReactNode; post: BlogPost }) => (
    <article className="prose dark:prose-invert">{children}</article>
  ),
};
