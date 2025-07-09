'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -70% 0%' }, // Adjust this margin as needed
    );

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el) => el !== null) as Element[];

    elements.forEach((el) => observer.current?.observe(el));

    return () => {
      elements.forEach((el) => observer.current?.unobserve(el));
    };
  }, [headings]);

  if (!headings.length) {
    return null;
  }

  return (
    <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 lg:block overflow-y-auto py-6 pl-6 pr-2">
      <h3 className="font-semibold mb-4 text-lg">On This Page</h3>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <Link
              href={`${pathname}#${heading.id}`}
              className={clsx(
                'block transition-colors duration-200 hover:text-foreground',
                {
                  'text-primary font-medium': activeId === heading.id,
                  'text-muted-foreground': activeId !== heading.id,
                  'pl-2': heading.level === 2,
                  'pl-4': heading.level === 3,
                  'pl-6': heading.level === 4,
                },
              )}
            >
              {heading.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
