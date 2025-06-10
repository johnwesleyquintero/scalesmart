'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';

interface BreadcrumbItem {
  name: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  const breadcrumbItems: BreadcrumbItem[] = pathSegments.map(
    (segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const name = segment
        .replace(/-/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { name, href };
    },
  );

  // Add a "Home" or "Docs" root if desired, for now, let's assume "Docs" is the root for documentation
  const finalBreadcrumbItems: BreadcrumbItem[] = [
    { name: 'Docs', href: '/docs' },
  ];

  // Filter out the 'docs' segment if it's the first segment and already handled by the root
  const filteredSegments = breadcrumbItems.filter(
    (item) => item.name.toLowerCase() !== 'docs',
  );

  finalBreadcrumbItems.push(...filteredSegments);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {finalBreadcrumbItems.map((item, index) => (
          <li key={item.href} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground mx-1" />
            )}
            {index === finalBreadcrumbItems.length - 1 ? (
              <span className="text-sm font-medium text-foreground">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
