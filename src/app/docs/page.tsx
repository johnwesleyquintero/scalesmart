import { redirect } from 'next/navigation';

export default function DocsRootPage() {
  // Redirect to the 'getting-started' page for a better user experience.  This prevents users from landing on an empty docs page.
  redirect('/docs/getting-started');
}
