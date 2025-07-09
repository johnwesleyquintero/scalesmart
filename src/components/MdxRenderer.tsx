'use client';

import React, { useState, useEffect, useRef } from 'react'; // Import useState, useEffect, and useRef

import { clsx } from 'clsx'; // Import clsx

// Component for the copy button
const CopyCodeButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Use ReturnType<typeof setTimeout>

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      title="Copy code to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

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

    // Safely extract code content from children
    let codeText = '';
    React.Children.forEach(children, (child: React.ReactNode) => {
      if (React.isValidElement(child) && 'props' in child) {
        const childProps = child.props as { children?: React.ReactNode };
        if (typeof childProps.children === 'string') {
          codeText += childProps.children;
        } else if (Array.isArray(childProps.children)) {
          codeText += React.Children.toArray(childProps.children).join('');
        }
      } else if (typeof child === 'string') {
        codeText += child;
      }
    });

    return (
      <div className="relative">
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
        {isCodeBlock &&
          codeText && ( // Only show button if it's a code block and has content
            <CopyCodeButton code={codeText.toString()} />
          )}
      </div>
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
