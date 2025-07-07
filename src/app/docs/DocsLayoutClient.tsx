'use client';

import React, { useState } from 'react';
import DocSearch from './components/DocSearch';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface DocsLayoutClientProps {
  children: React.ReactNode;
}

export default function DocsLayoutClient({ children }: DocsLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Hamburger menu for mobile */}
      <Button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50"
        aria-label="Toggle documentation navigation"
        size="icon"
        variant="outline"
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>
      {children}
    </>
  );
}
