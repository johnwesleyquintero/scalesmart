import { getUserWithProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, error } = await getUserWithProfile();

  // Handle potential errors during fetching
  if (error) {
    console.error(
      'Error fetching user or profile for CRM page:',
      error.message,
    );
    // Redirect to an error page or login page
    redirect('/login?message=Error fetching user data.');
  }

  // Check if user exists and has the 'sales', 'support', 'manager', or 'admin' role
  const allowedRoles = ['sales', 'support', 'manager', 'admin'];
  if (!user || !profile || !allowedRoles.includes(profile.role)) {
    // Redirect to login or an access denied page
    redirect('/login?message=You do not have permission to access the CRM.');
  }

  // If authorized, render the children
  return <>{children}</>;
}
