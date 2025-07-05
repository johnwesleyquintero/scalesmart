import { redirect } from 'next/navigation';
import React from 'react';
import type { Metadata } from 'next'; // Import Metadata type

export const metadata: Metadata = {
  title: 'CRM Dashboard | ScaleSmart Platform', // Example title, adjust as needed
  description:
    'Manage your customer relationships, track interactions, and organize contact information on the ScaleSmart Platform CRM dashboard.', // Example description, adjust as needed
  alternates: {
    canonical: 'https://wescode.vercel.app/crm', // Set the correct canonical URL
  },
};

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For this local-first application, authentication/authorization is not implemented.
  // Access to CRM features is direct.
  return <>{children}</>;
}
