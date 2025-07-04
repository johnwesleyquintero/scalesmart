'use client';

import React from 'react';

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
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return (
      <h1 id={id} {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return (
      <h2 id={id} {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return (
      <h3 id={id} {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }: React.ComponentPropsWithoutRef<'h4'>) => {
    const id = slugify(React.Children.toArray(children).join(''));
    return (
      <h4 id={id} {...props}>
        {children}
      </h4>
    );
  },
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
    <li {...props}>{children}</li>
  ),
  blockquote: ({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote {...props}>{children}</blockquote>
  ),
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table {...props}>{children}</table>
    </div>
  ),
  tr: ({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) => (
    <tr {...props}>{children}</tr>
  ),
  th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
    <th {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
    <td {...props}>{children}</td>
  ),
  a: ({ children, href, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a href={href} {...props}>
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
        'relative rounded bg-gray-900 text-gray-200 px-[0.3rem] py-[0.2rem] font-mono text-sm', // Added dark background and light text
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
          'relative rounded bg-gray-900 text-gray-200 px-[0.3rem] py-[0.2rem] font-mono text-sm overflow-x-auto my-4 p-4 rounded-md', // Added dark background and light text
          className,
        )}
        {...cleanedProps}
      >
        {children}
      </pre>
    );
  },
  kbd: ({ children, ...props }: React.ComponentPropsWithoutRef<'kbd'>) => (
    <kbd {...props}>{children}</kbd>
  ),
  hr: () => <hr />,
  // Add any other custom components you want to use in your MDX files
};

// This component is now just a placeholder for the components object
// The actual rendering will be done by MDXRemote in ArticleModule
const MdxRenderer = () => {
  return null; // This component doesn't render anything directly
};

export default MdxRenderer;
