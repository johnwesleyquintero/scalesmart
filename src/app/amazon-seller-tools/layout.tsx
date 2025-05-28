import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: `https://wescode.vercel.app/amazon-seller-tools`,
  },
};

export default function AmazonSellerToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
