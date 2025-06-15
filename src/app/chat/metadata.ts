import { Metadata } from 'next';

const PAGE_TITLE = 'WesAI Chat';
const PAGE_DESCRIPTION =
  'Engage with WesAI, your AI assistant for data insights and support.';
const PAGE_URL = 'https://wescode.vercel.app/chat'; // Correct canonical URL for the chat page

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  // Optionally inherit or override other metadata from the root layout if needed
  // For example, you might want to define specific keywords or Open Graph tags for this page.
  // keywords: ['chat', 'AI assistant', 'data insights', 'support'],
  // openGraph: {
  //   url: PAGE_URL,
  //   title: PAGE_TITLE,
  //   description: PAGE_DESCRIPTION,
  //   // Add specific images if available for this page
  // },
  // twitter: {
  //   title: PAGE_TITLE,
  //   description: PAGE_DESCRIPTION,
  //   // Add specific images if available for this page
  // },
};
