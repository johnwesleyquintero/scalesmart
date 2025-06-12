import { getUserWithProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, error } = await getUserWithProfile();

  // Handle potential errors during fetching
  if (error) {
    console.error('Error fetching user data for profile page:', error.message);
    // Redirect to an error page or login page
    redirect('/login?message=Error fetching user data.');
  }

  // Check if user exists
  if (!user) {
    // Redirect to login if not logged in
    redirect('/login?message=You must be logged in to view your profile.');
  }

  // If authorized (user is logged in), render the children
  return <>{children}</>;
}
