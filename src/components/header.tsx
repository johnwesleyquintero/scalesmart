'use client';

import Logo from '@/components/Logo'; // Added import for your Logo component
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, Menu, Moon, Sun, X } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cachedFetch } from '@/lib/api-cache';

const SITE_TITLE = 'ScaleSmart'; // Define your site title here
const COMMON_BUTTON_CLASSES =
  'text-sm font-medium transition-all duration-300 hover:text-primary';

// Define a more structured NavItem interface
interface NavItem {
  name: string;
  href?: string;
  external?: boolean;
  className?: string;
  onClick?: () => void;
  auth?: 'loggedIn' | 'loggedOut' | 'always';
  hideOnMobile?: boolean;
  children?: NavItem[];
}

export default function Header() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { blog: [], tools: [] };
      console.time('Fetch search results');
      const data = await cachedFetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
      );
      console.timeEnd('Fetch search results');
      return data;
    },
    enabled: !!debouncedQuery,
  });

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery && !searchHistory.includes(searchQuery)) {
      setSearchHistory((prev) => [searchQuery, ...prev].slice(0, 5));
    }
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleExportClick = async () => {
    try {
      setIsDownloading(true);
      const response = await cachedFetch('/api/download');
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Wesley_Quintero_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download resume:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Consolidate navItems, including auth actions
  const navItems: NavItem[] = [
    { name: 'Home', href: '#hero', auth: 'always' },
    {
      name: 'Projects',
      href: '#projects',
      auth: 'always',
      children: [
        {
          name: 'Amazon Seller Tools',
          href: '/amazon-seller-tools',
          external: true,
          auth: 'always',
        },
        {
          name: 'Resume Scanner', // Our new star!
          href: '/ats', // Assuming this will be the route for it
          auth: 'always',
        },
        {
          name: 'CRM',
          href: '/crm',
          auth: 'always',
        },
        {
          name: 'Project Management',
          href: '/project-management',
          auth: 'always',
        },
        {
          name: 'Free Certificate Courses',
          href: '/academy',
          external: true,
          auth: 'always',
        },
        {
          name: 'Workflow Builder',
          href: '/workflow-builder',
          auth: 'always',
        },
      ],
    },
    {
      name: 'About',
      auth: 'always',
      children: [
        { name: 'About', href: '#about', auth: 'always' },
        { name: 'Certifications', href: '#certifications', auth: 'always' },
        {
          name: 'Resume',
          href: 'https://johnwesleyquintero-resume.netlify.app/',
          external: true,
          auth: 'always',
        },
      ],
    },
    { name: 'Blog', href: '#blog', auth: 'always' },
    { name: 'Contact', href: '#contact', auth: 'always' },

    {
      name: 'Sign In',
      onClick: () => signIn(),
      auth: 'loggedOut',
      className: COMMON_BUTTON_CLASSES,
    },
    {
      name: 'Sign Out',
      onClick: () => signOut(),
      auth: 'loggedIn',
      className:
        'text-sm font-medium transition-all duration-300 hover:text-primary',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={`${SITE_TITLE}: Homepage`}
          >
            {/* Replaced Image with your Logo component */}
            {/* Using h-8 w-8 for a size similar to the previous 32x32px */}
            <Logo className="h-8 w-8" title={`${SITE_TITLE} Site Logo`} />
            <span className="text-2xl font-semibold">{SITE_TITLE}</span>
          </Link>

          <nav className="hidden md:flex md:gap-6 items-center">
            {navItems
              .filter((item) => {
                if (item.auth === 'loggedIn' && !session) return false;
                if (item.auth === 'loggedOut' && session) return false;
                return true;
              })
              .map((item) => {
                if (item.children) {
                  return (
                    <div key={item.name} className="relative group">
                      <button className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 group-hover:after:w-full">
                        {item.name}
                      </button>
                      {/* Removed mt-2 to close the gap between button and dropdown */}
                      <div className="absolute hidden group-hover:block top-full left-0 py-2 w-48 bg-white border rounded-md shadow-md z-10">
                        {item.children.map((child) => {
                          if (child.external) {
                            return (
                              <a
                                key={child.name}
                                href={child.href || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {child.name}
                              </a>
                            );
                          }
                          return (
                            <Link
                              key={child.name}
                              href={child.href || '/'}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const commonClasses = cn(
                  'text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full',
                  item.className,
                );

                if (item.onClick) {
                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      onClick={item.onClick}
                      className={cn(COMMON_BUTTON_CLASSES, item.className)}
                    >
                      {item.name}
                    </Button>
                  );
                }

                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={commonClasses}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href || '/'}
                    className={commonClasses}
                  >
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block search-container">
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => {
                  handleSearch(e.target.value);
                }}
                onFocus={() => {
                  setIsSearchOpen(true);
                }}
                className="h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>

              {(query || isSearchOpen) && (
                <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-2 shadow-md max-h-[300px] overflow-y-auto">
                  {!query && searchHistory.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2 text-sm font-medium text-muted-foreground">
                        Recent Searches
                      </div>
                      {searchHistory.map((item) => (
                        <button
                          key={item}
                          className="block w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            handleSearch(item);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex items-center justify-center py-2 text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  )}
                  {!isLoading && data && !(data instanceof Response) && (
                    <div className="space-y-4">
                      {(
                        data as {
                          blog: { slug: string; title: string }[];
                          tools: { id: string }[];
                        }
                      ).blog &&
                      (
                        data as {
                          blog: { slug: string; title: string }[];
                          tools: { id: string }[];
                        }
                      ).blog.length > 0 ? (
                        <div key="blog">
                          <div className="mb-2 text-sm font-medium text-muted-foreground">
                            Blog Posts
                          </div>
                          {(
                            data as {
                              blog: { slug: string; title: string }[];
                              tools: { id: string }[];
                            }
                          ).blog.map(
                            (item: { slug: string; title: string }) => (
                              <Link
                                key={item.slug}
                                href={`/blog/${item.slug}`}
                                className={cn(
                                  'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                                )}
                                onClick={() => {
                                  setQuery('');
                                  setIsSearchOpen(false);
                                }}
                              >
                                {item.title}
                              </Link>
                            ),
                          )}
                        </div>
                      ) : null}
                      {(
                        data as {
                          blog: { slug: string; title: string }[];
                          tools: { id: string }[];
                        }
                      ).tools &&
                      (
                        data as {
                          blog: { slug: string; title: string }[];
                          tools: { id: string }[];
                        }
                      ).tools.length > 0 ? (
                        <div key="tools">
                          <div className="mb-2 text-sm font-medium text-muted-foreground">
                            Tools
                          </div>
                          {(
                            data as {
                              blog: { slug: string; title: string }[];
                              tools: { id: string }[];
                            }
                          ).tools.map((item: { id: string }) => (
                            <Link
                              key={item.id}
                              href={`#${item.id}`}
                              className={cn(
                                'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                              )}
                              onClick={() => {
                                setQuery('');
                                setIsSearchOpen(false);
                              }}
                            >
                              {item.id}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                      {!(
                        data as {
                          blog: { slug: string; title: string }[];
                          tools: { id: string }[];
                        }
                      ).blog?.length &&
                      !(
                        data as {
                          blog: { slug: string; title: string }[];
                          tools: { id: string }[];
                        }
                      ).tools?.length ? (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          No results found
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            {mounted && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  className="mr-2"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                  }}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Export as PDF"
                  className="mr-2"
                  onClick={handleExportClick}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {isMenuOpen && (
            <div className="absolute left-0 right-0 top-16 z-50 border-b bg-background/95 backdrop-blur-sm p-4 md:hidden animate-fadeIn">
              <nav className="flex flex-col space-y-4">
                {navItems
                  .filter((item) => {
                    if (item.auth === 'loggedIn' && !session) return false;
                    if (item.auth === 'loggedOut' && session) return false;
                    return !item.hideOnMobile;
                  })
                  .map((item) => {
                    if (item.children) {
                      return (
                        <div key={item.name}>
                          <button
                            className="block px-3 py-2 text-base font-medium transition-all duration-300 hover:text-primary hover:bg-accent rounded-md w-full text-left"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.name}
                          </button>
                          {item.children.map((child) => {
                            if (child.external) {
                              return (
                                <a
                                  key={child.name}
                                  href={child.href || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-6 py-2 text-base font-medium transition-all duration-300 hover:text-primary hover:bg-accent rounded-md"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {child.name}
                                </a>
                              );
                            }
                            return (
                              <Link
                                key={child.name}
                                href={child.href || '/'}
                                className="block px-6 py-2 text-base font-medium transition-all duration-300 hover:text-primary hover:bg-accent rounded-md"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      );
                    }

                    const mobileItemClasses = cn(
                      'block px-3 py-2 text-base font-medium transition-all duration-300 hover:text-primary hover:bg-accent rounded-md',
                      item.className,
                    );

                    if (item.onClick) {
                      return (
                        <Button
                          key={item.name}
                          variant="ghost"
                          onClick={() => {
                            item.onClick?.();
                            setIsMenuOpen(false);
                          }}
                          className={cn(
                            mobileItemClasses,
                            'w-full text-left justify-start',
                          )}
                        >
                          {item.name}
                        </Button>
                      );
                    }

                    if (item.external) {
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          className={mobileItemClasses}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.name}
                        </a>
                      );
                    }

                    // Rollback strategy: To revert to the previous version, simply remove the cachedFetch import
                    // and replace cachedFetch with fetch.

                    return (
                      <Link
                        key={item.name}
                        href={item.href || '/'}
                        className={mobileItemClasses}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
