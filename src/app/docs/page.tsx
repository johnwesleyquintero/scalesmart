import { redirect } from 'next/navigation';

export default function DocsRootPage() {
  // Redirect to the first documentation article by default
  redirect('/docs/getting-started');
}