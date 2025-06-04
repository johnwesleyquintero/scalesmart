'use client';

import React from 'react';
import Quiz from '../app/academy/components/Quiz';
import { clsx } from 'clsx'; // Import clsx

// Utility function to slugify text for IDs
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Define custom components to be used within MDX
// These components will override default HTML elements or provide custom functionality
export const components = {
  h1: ({ children }: { children: React.ReactNode }) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return <h1 id={id}>{children}</h1>;
  },
  h2: ({ children }: { children: React.ReactNode }) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return <h2 id={id}>{children}</h2>;
  },
  h3: ({ children }: { children: React.ReactNode }) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return <h3 id={id}>{children}</h3>;
  },
  h4: ({ children }: { children: React.ReactNode }) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return <h4 id={id}>{children}</h4>;
  },
  p: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  ol: ({ children }: { children: React.ReactNode }) => <ol>{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote>{children}</blockquote>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 w-full overflow-y-auto">
      <table>{children}</table>
    </div>
  ),
  tr: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  th: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  td: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
  code: ({
    children,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<'code'>) => (
    <code
      className={clsx(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({
    children,
    className,
    ...rest
  }: React.ComponentPropsWithoutRef<'pre'>) => {
    const isCodeBlock = className && className.includes('language-');
    const effectiveTabIndex = isCodeBlock ? 0 : rest.tabIndex || undefined;

    const cleanedProps = { ...rest };
    if ('tabIndex' in cleanedProps) {
      delete cleanedProps.tabIndex;
    }

    return (
      <pre
        tabIndex={effectiveTabIndex}
        className={clsx(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm overflow-x-auto my-4 p-4 rounded-md',
          className,
        )}
        {...cleanedProps}
      >
        {children}
      </pre>
    );
  },
  kbd: ({ children }: { children: React.ReactNode }) => <kbd>{children}</kbd>,
  hr: () => <hr />,
  Quiz: Quiz,
  // Add any other custom components you want to use in your MDX files
};

// This component is now just a placeholder for the components object
// The actual rendering will be done by MDXRemote in ArticleModule
const MdxRenderer = () => {
  return null; // This component doesn't render anything directly
};

export default MdxRenderer;
