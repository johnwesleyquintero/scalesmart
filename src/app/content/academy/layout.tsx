import { getUserWithProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, error } = await getUserWithProfile();

  // Handle potential errors during fetching
  if (error) {
    console.error('Error fetching user or profile:', error.message);
    // Redirect to an error page or login page
    redirect('/login?message=Error fetching user data.');
  }

  // Check if user exists and has the 'subscriber' role
  if (!user || !profile || profile.role !== 'subscriber') {
    // Redirect to login or an access denied page
    redirect('/login?message=You must be a subscriber to access the Academy.');
  }

  // If authorized, render the children
  return <>{children}</>;
}
