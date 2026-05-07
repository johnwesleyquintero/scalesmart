import Footer from '@/components/footer';
import Header from '@/components/header';
import { BlogPost } from '@/types';
import type React from 'react';

export default function BlogLayout({
  children,
}: {
  readonly children: React.ReactNode;
  readonly post?: BlogPost;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:bg-background dark:bg-none">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
