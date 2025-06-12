import { getUserWithProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function WorkflowBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, error } = await getUserWithProfile();

  // Handle potential errors during fetching
  if (error) {
    console.error(
      'Error fetching user or profile for workflow builder:',
      error.message,
    );
    // Redirect to an error page or login page
    redirect('/login?message=Error fetching user data.');
  }

  // Check if user exists and has the 'editor' or 'admin' role
  const allowedRoles = ['editor', 'admin'];
  if (!user || !profile || !allowedRoles.includes(profile.role)) {
    // Redirect to login or an access denied page
    redirect(
      '/login?message=You do not have permission to access the Workflow Builder.',
    );
  }

  // If authorized, render the children
  return <>{children}</>;
}
