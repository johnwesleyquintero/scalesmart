import { Button } from '@/components/ui/button';
import SearchInput from './header/SearchInput';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, Menu, Moon, Sun, X } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useExport } from './header/use-export';
import { useHeaderData } from './header/use-header-data';

export default function Header() {
  const { data: session, status } = useSession(); // Get session data and status using next-auth
  const {
    query,
    setQuery,
    debouncedQuery,
    isSearchOpen,
    setIsSearchOpen,
    isMenuOpen,
    setIsMenuOpen,
    searchHistory,
    setSearchHistory,
  } = useHeaderData();
  const { isDownloading, handleExportClick } = useExport();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    // Fetch search results using react-query
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { blog: [], tools: [] }; // Return empty results if no query
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
      );
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    },
    enabled: !!debouncedQuery,
  });


  const toggleMenu = () => {
    // Function to toggle the mobile menu
    setIsMenuOpen(!isMenuOpen);
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
      href: 'https://sellsmart-hub.vercel.app/',
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
      {status === 'authenticated' || status === 'unauthenticated' ? ( // Conditionally render header based on authentication status
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="Site Logo"
                width={32}
                height={32}
              />
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
              <SearchInput
                query={query}
                setQuery={setQuery}
                isSearchOpen={isSearchOpen}
                setIsSearchOpen={setIsSearchOpen}
                isLoading={isLoading}
                data={data}
                searchHistory={searchHistory}
                setSearchHistory={setSearchHistory}
              />

              {mounted && ( // Only render after component is mounted
                <>
                  <Button // Theme toggle button
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
                  <Button // Export as PDF button
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

              <Button // Mobile menu toggle button
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
      ) : null}
    </>
  );
}
