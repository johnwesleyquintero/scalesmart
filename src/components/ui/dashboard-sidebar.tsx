'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sidebar } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Props for the DashboardSidebar component.
 */
interface DashboardSidebarProps {
  /** Indicates if the current page is the dashboard page. */
  isDashboardPage?: boolean;
}

/**
 * A sidebar component for the dashboard, providing navigation and context.
 */
export function DashboardSidebar({
  isDashboardPage,
}: Readonly<DashboardSidebarProps>) {
  const [isOpen, setIsOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-0 px-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 sm:w-60">
        <SheetHeader className="text-left">
          <SheetTitle>Dashboard Menu</SheetTitle>
          <SheetDescription>
            Manage your account preferences, sales, and more.
          </SheetDescription>
        </SheetHeader>
        {isDashboardPage ? (
          <Sidebar className="mt-4" />
        ) : (
          <div className="mt-4">
            {/* Add content for non-dashboard pages if needed */}
            <p>Additional content for non-dashboard pages.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
