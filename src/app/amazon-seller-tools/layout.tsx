import type { Metadata } from 'next';

/**
 * Metadata for the Amazon Seller Tools page.
 * Defines canonical URL for SEO.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: `https://wescode.vercel.app/amazon-seller-tools`,
  },
};

/**
 * Props interface for the AmazonSellerToolsLayout component.
 * @property {React.ReactNode} children - The child components to be rendered within the layout.
 */
interface AmazonSellerToolsLayoutProps {
  children: React.ReactNode;
}

/**
 * `AmazonSellerToolsLayout` is a layout component for the Amazon Seller Tools section.
 * It provides a consistent structure for pages within this section.
 *
 * @param {AmazonSellerToolsLayoutProps} props - The props for the component.
 * @param {React.ReactNode} props.children - The content to be rendered within the layout.
 * @returns {JSX.Element} The layout wrapper for Amazon Seller Tools pages.
 */
export default function AmazonSellerToolsLayout({
  children,
}: AmazonSellerToolsLayoutProps) {
  return <>{children}</>;
}
