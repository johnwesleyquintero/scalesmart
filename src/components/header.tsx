'use client';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { Menu, Moon, Sun, X } from 'lucide-react'; // Removed FileText, Loader2
// Authentication removed - using simplified approach
import { useScroll } from '@/hooks/use-scroll';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import React from 'react'; // Added React for ListItem

const SITE_TITLE = 'ScaleSmart';

interface NavItem {
  name: string;
  href?: string;
  external?: boolean;
  className?: string;
  onClick?: () => void; // Kept for potential future use
  auth?: 'loggedIn' | 'loggedOut' | 'always';
  hideOnMobile?: boolean;
  children?: NavItemChild[];
  category?: string;
  description?: string;
}

interface NavItemChild {
  name: string;
  href?: string;
  external?: boolean;
  description?: string;
  category?: string;
}

export default function Header() {
  // const { data: session } = useSession(); // Authentication removed
  const scrolled = useScroll(50);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const productsCategories: string[] = [
    'Tools & Automation',
    'Insights & Learning',
  ];

  const navItems: NavItem[] = [
    {
      name: 'Services',
      children: [
        {
          name: 'Operations & Growth',
          href: '/services/operations-growth',
          description: 'Systems design, lead gen, and e-commerce operations.',
        },
        {
          name: 'Workforce & Workflows',
          href: '/services/workforce-workflows',
          description: 'VA management and intelligent automation.',
        },
        {
          name: 'Brand & Support',
          href: '/services/brand-support',
          description: 'Customer handling and content execution.',
        },
      ],
    },
    {
      name: 'How It Works',
      href: '/#how-it-works',
    },
    {
      name: 'Pricing',
      href: '/pricing',
    },
    {
      name: 'About',
      href: '/about',
    },
    {
      name: 'Resources',
      children: [
        {
          name: 'Prompt Generator',
          href: '/prompt-request-generator',
          category: productsCategories[0],
          description: 'Custom tools to streamline your AI workflows.',
        },
        {
          name: 'Blogs',
          href: '/blog',
          category: productsCategories[1],
          description: 'Operational insights and company updates.',
        },
        {
          name: 'Success Stories',
          href: '/#success-stories',
          category: productsCategories[1],
          description: 'Real results from ScaleSmart systems.',
        },
        {
          name: 'FAQ',
          href: '/faq',
          category: productsCategories[1],
          description: 'Answers to common scaling questions.',
        },
      ],
    },
    {
      name: 'Careers',
      href: '/careers',
    },
    {
      name: 'Contact',
      href: '/contact',
    },
  ];

  // ListItem component for NavigationMenu
  const ListItem = React.forwardRef<
    React.ElementRef<'a'>,
    React.ComponentPropsWithoutRef<'a'> & { title: string }
  >(({ className, title, children, href, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            href={href || '/'}
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  });
  ListItem.displayName = 'ListItem';

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all',
          scrolled
            ? 'border-b bg-background/70 backdrop-blur-lg'
            : 'bg-background/0',
        )}
      >
        <div className="container flex h-16 items-center justify-between">
          {/* Left Group: Logo + Nav */}
          <div className="flex items-center gap-x-6">
            {' '}
            {/* Added gap-x-6 for spacing */}
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" title={`${SITE_TITLE} Site Logo`} />
              <span className="text-2xl font-bold tracking-tight">
                {SITE_TITLE}
              </span>
            </Link>
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    {item.children ? (
                      <>
                        <NavigationMenuTrigger>
                          {item.name}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          {item.name === 'Resources' ? (
                            <div className="grid w-[600px] gap-3 p-4 md:grid-cols-2 lg:w-[700px] lg:grid-cols-3">
                              {productsCategories.map((category) => (
                                <div
                                  key={category}
                                  className="flex flex-col space-y-2"
                                >
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                                    {category}
                                  </h4>
                                  <ul className="space-y-1">
                                    {item.children
                                      ?.filter(
                                        (child) => child.category === category,
                                      )
                                      .map((child) => (
                                        <ListItem
                                          key={child.name}
                                          title={child.name}
                                          href={child.href}
                                          target={
                                            child.external
                                              ? '_blank'
                                              : undefined
                                          }
                                          rel={
                                            child.external
                                              ? 'noopener noreferrer'
                                              : undefined
                                          }
                                        >
                                          {child.description}
                                        </ListItem>
                                      ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // For "Solutions" or other dropdowns
                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                              {item.children?.map((child) => (
                                <ListItem
                                  key={child.name}
                                  title={child.name}
                                  href={child.href}
                                  target={child.external ? '_blank' : undefined}
                                  rel={
                                    child.external
                                      ? 'noopener noreferrer'
                                      : undefined
                                  }
                                >
                                  {child.description}
                                </ListItem>
                              ))}
                            </ul>
                          )}
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href || '/'}
                          className={navigationMenuTriggerStyle()}
                        >
                          {item.name}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-4 min-w-[150px]">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
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
            <div
              className={cn(
                'fixed inset-0 top-16 z-40 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden',
                'bg-background/95 backdrop-blur-sm',
              )}
            >
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => {
                  if (item.children) {
                    return (
                      <div key={item.name}>
                        <h4 className="font-medium text-foreground mb-2">
                          {item.name}
                        </h4>
                        <ul className="space-y-2 pl-4">
                          {item.children.map((child) => {
                            if (child.external) {
                              return (
                                <li key={child.name}>
                                  <a
                                    href={child.href || '/'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block py-1 text-muted-foreground hover:text-primary"
                                    onClick={toggleMenu}
                                  >
                                    {child.name}
                                  </a>
                                </li>
                              );
                            }
                            return (
                              <li key={child.name}>
                                <Link
                                  href={child.href || '/'}
                                  className="block py-1 text-muted-foreground hover:text-primary"
                                  onClick={toggleMenu}
                                >
                                  {child.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href || '/'}
                      className="block py-2 text-base font-medium text-foreground hover:text-primary"
                      onClick={toggleMenu}
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
