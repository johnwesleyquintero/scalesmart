import { redirect } from 'next/navigation';
import React from 'react';

export default async function ProjectManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily remove authorization logic as Supabase is being removed.
  // This will need to be re-implemented with a new authentication system.
  return <>{children}</>;
}
