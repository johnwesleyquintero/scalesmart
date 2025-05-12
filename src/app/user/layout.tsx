'use client';
import React from 'react';

import { DashboardBreadcrumb } from '@/components/ui/dashboard-breadcrumb';
import { DashboardSidebar } from '@/components/ui/dashboard-sidebar';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { AuthDisplay } from './auth-display';

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/api/auth/signin');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <DashboardSidebar isDashboardPage={true} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <DashboardBreadcrumb />
            <AuthDisplay />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
