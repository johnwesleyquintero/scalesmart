import { redirect } from 'next/navigation';
import React from 'react';
import { cookies } from 'next/headers'; // Import cookies

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily remove authorization logic as Supabase is being removed.
  // In a real application, you would replace this with your new authentication/authorization system.
  return <>{children}</>;
}
