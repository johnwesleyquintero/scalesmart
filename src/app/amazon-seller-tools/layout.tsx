import { redirect } from 'next/navigation';
import React from 'react';

export default async function AmazonSellerToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For this local-first application, authentication/authorization is not implemented.
  // Access to Amazon Seller Tools features is direct.
  return <>{children}</>;
}
