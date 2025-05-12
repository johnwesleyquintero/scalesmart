'use client';

import { Card } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold my-6">
        Welcome, {session?.user?.name}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Tools</h2>
          <p className="text-gray-600">
            Access your saved configurations and data analysis tools.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">CRM Dashboard</h2>
          <p className="text-gray-600">
            Manage your customer relationships and interactions.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Integration</h2>
          <p className="text-gray-600">
            View and manage your integrated projects and workflows.
          </p>
        </Card>
      </div>
    </div>
  );
}
