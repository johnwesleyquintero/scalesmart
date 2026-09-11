'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Award, BookOpen, GraduationCap, Map } from 'lucide-react';

interface TabItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const navTabs: TabItem[] = [
  {
    name: 'Academy Hub',
    href: '/academy',
    icon: GraduationCap,
    exact: true,
  },
  {
    name: 'Certifications',
    href: '/academy/certifications',
    icon: Award,
  },
  {
    name: 'Learning Paths',
    href: '/academy#paths',
    icon: Map,
  },
  {
    name: 'Courses',
    href: '/academy#courses',
    icon: BookOpen,
  },
];

export default function AcademyNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-center sm:justify-start overflow-x-auto py-3 mb-8 border-b border-border/60">
      <nav className="inline-flex p-1 bg-muted/60 backdrop-blur rounded-2xl border border-border/50 gap-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname
            ? tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
            : false;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 whitespace-nowrap',
                isActive
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  isActive ? 'text-amber-500' : 'text-muted-foreground',
                )}
              />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
