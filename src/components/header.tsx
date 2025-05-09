'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, Menu, Moon, Sun, X } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
      );
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    },
    enabled: !!debouncedQuery,
  });

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery && !searchHistory.includes(searchQuery)) {
      setSearchHistory((prev) => [searchQuery, ...prev].slice(0, 5));
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleExportClick = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch('/api/download');
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

  const navItems = [
    { name: 'Home', href: '#hero' },
    { name: 'Projects', href: '#projects' },
    { name: 'Tools', href: '#tools' },
    { name: 'About', href: '#about' },
    { name: 'Certifications', href: '#certifications' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
    {
      name: 'Platform',
      href: 'https://amzsync.vercel.app/',
      external: true,
    },
    {
      name: 'Resume',
      href: 'https://johnwesleyquintero-resume.netlify.app/',
      external: true,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/favicon.svg" alt="Site Logo" width={32} height={32} />
            <span className="text-xl font-bold">Wesley Quintero</span>
          </Link>

          <nav className="hidden md:flex md:gap-6 items-center">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.name}
                </Link>
              ),
            )}
            {session ? (
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="text-sm font-medium transition-all duration-300 hover:text-primary"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => signIn()}
                className="text-sm font-medium transition-all duration-300 hover:text-primary"
              >
                Sign In
              </Button>
            )}
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
                  {!isLoading && data && (
                    <div className="space-y-4">
                      {data.blog && data.blog.length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium text-muted-foreground">
                            Blog Posts
                          </div>
                          {data.blog.map(
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
                      )}
                      {data.tools && data.tools.length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium text-muted-foreground">
                            Tools
                          </div>
                          {data.tools.map((item: { id: string }) => (
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
                      )}
                      {!data.blog?.length && !data.tools?.length && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          No results found
                        </div>
                      )}
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
                {navItems.map((item) =>
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setIsMenuOpen(false);
                      }}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                      onClick={() => {
                        setIsMenuOpen(false);
                      }}
                    >
                      {item.name}
                    </Link>
                  ),
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
