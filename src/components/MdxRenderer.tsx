'use client';

import React from 'react';
import Quiz from '../app/academy/components/Quiz';
import { clsx } from 'clsx'; // Import clsx

// Define custom components to be used within MDX
// These components will override default HTML elements or provide custom functionality
export const components = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mt-8 scroll-m-20 text-3xl font-bold tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-10 scroll-m-20 border-b pb-1 text-2xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight">
      {children}
    </h4>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full">{children}</table>
    </div>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="m-0 border-t p-0 even:bg-muted">{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </td>
  ),
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a href={href} className="font-medium underline underline-offset-4">
      {children}
    </a>
  ),
  code: ({
    children,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<'code'>) => (
    <code
      className={clsx(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className, // Allow incoming classNames from rehype-prism-plus
      )}
      {...props} // Spread any other props, e.g., language-xxx
    >
      {children}
    </code>
  ),
  pre: ({
    children,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<'pre'>) => {
    // Ensure tabIndex is always 0 if it's a code block, to match server rendering
    const finalProps = { ...props };
    return (
      <pre
        className={clsx(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm overflow-x-auto my-4 p-4 rounded-md',
          className, // Allow incoming classNames from rehype-prism-plus
        )}
        {...finalProps} // Spread any other props, e.g., language-xxx
      >
        {children}
      </pre>
    );
  },
  kbd: ({ children }: { children: React.ReactNode }) => (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
      {children}
    </kbd>
  ),
  hr: () => <hr className="my-4 md:my-8" />,
  Quiz: Quiz,
  // Add any other custom components you want to use in your MDX files
};

// This component is now just a placeholder for the components object
// The actual rendering will be done by MDXRemote in ArticleModule
const MdxRenderer = () => {
  return null; // This component doesn't render anything directly
};

export default MdxRenderer;
