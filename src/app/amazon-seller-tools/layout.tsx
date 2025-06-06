import type { Metadata } from 'next';
// React is implicitly available for React.ReactNode in Next.js environments

export const metadata: Metadata = {
  alternates: {
    canonical: `https://wescode.vercel.app/amazon-seller-tools`,
  },
};

// Use an explicit interface for props for better readability and reusability
interface AmazonSellerToolsLayoutProps {
  children: React.ReactNode;
}

export default function AmazonSellerToolsLayout({
  children,
}: AmazonSellerToolsLayoutProps) {
  return <>{children}</>;
}
