import React from 'react';
import Header from 'components/header'; // Assuming this path is correct
import { Button } from 'components/ui/button'; // Assuming this path is correct
import { redirect } from 'next/navigation';
// Adjust path and add type import if needed
import { getSupabaseSession } from 'lib/supabase/server';
// Assuming Supabase types are available from the client library (e.g., '@supabase/supabase-js')
import { Session } from '@supabase/supabase-js';

/**
 * Defines standard redirect paths used in the component.
 */
const REDIRECT_PATHS = {
  PERMISSION_DENIED: '/permission-denied',
  ERROR: '/error',
  // ROOT: '/', // Potentially useful
};

/**
 * Retrieves the list of authorized admin GitHub usernames from environment variables.
 * Splits the comma-separated string, trims whitespace, and filters out empty entries.
 * @returns An array of admin GitHub usernames.
 */
function getAdminUsernames(): string[] {
  // Note: For better type safety and documentation, define process.env
  // in next-env.d.ts or a custom env.d.ts file.
  const adminUsernamesEnv = process.env.ADMIN_GITHUB_USERNAMES;

  if (!adminUsernamesEnv) {
    // This check is also performed early in the AdminPage component,
    // but keeping the logic here robust is also good practice.
    return [];
  }

  return adminUsernamesEnv
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * AdminPage component (Server Component).
 * This page is protected and only accessible to users whose GitHub username
 * is listed in the ADMIN_GITHUB_USERNAMES environment variable.
 *
 * Fetches the user session and performs authorization checks.
 * Redirects unauthorized users or on error.
 */
export default async function AdminPage(): Promise<React.ReactElement> {
  // --- Environment Variable Check ---
  // Ensure the necessary environment variable is set before proceeding.
  // Environment validation (line 52)
  if (!process.env.ADMIN_GITHUB_USERNAMES) {
    console.error(
      'FATAL: ADMIN_GITHUB_USERNAMES environment variable is not set. Admin page is inaccessible.',
    );
    // Redirect or throw an error as appropriate for your application's
    // handling of critical configuration issues. Redirecting to error page.
    return redirect(REDIRECT_PATHS.ERROR);
  }

  // --- Session Retrieval ---
  let session: Session | null = null;
  let sessionError: Error | null = null;

  try {
    // Attempt to retrieve the user session.
    // Assuming getSupabaseSession returns { data: { session: Session | null } | null, error: Error | null }
    const { data, error } = await getSupabaseSession();
    session = data?.session ?? null; // Safely access session data
    sessionError = error;
  } catch (e: unknown) {
    // Catch any unexpected errors during the getSupabaseSession function call itself (e.g., network issues)
    console.error('Unexpected error during getSupabaseSession:', e);
    return redirect(REDIRECT_PATHS.ERROR);
  }

  // Handle specific errors returned by getSupabaseSession utility (e.g., misconfiguration)
  if (sessionError) {
    console.error(
      'Error fetching session for admin page:',
      sessionError.message,
    );
    return redirect(REDIRECT_PATHS.ERROR);
  }

  // --- Authorization Check ---
  const adminUsernames = getAdminUsernames();

  // Retrieve the current user's GitHub username from session metadata.
  // Uses optional chaining for safer access to nested properties.
  const currentUserGitHubUsername = session?.user?.user_metadata?.user_name as
    | string
    | undefined; // Explicitly type for clarity

  // Check if the user is authenticated and if their GitHub username is in the admin list.
  const isAuthorizedAdmin =
    session?.user &&
    currentUserGitHubUsername &&
    adminUsernames.includes(currentUserGitHubUsername);

  if (!isAuthorizedAdmin) {
    // Log unauthorized access attempt with more details for monitoring.
    console.warn(
      `Unauthorized access attempt to admin page. User ID: ${
        session?.user?.id || 'Unknown/Not Authenticated'
      }, Email: ${
        session?.user?.email || 'Unknown/Not Authenticated'
      }, GitHub Username: ${currentUserGitHubUsername || 'Not Provided/Not Authenticated'}`,
    );
    // Redirect them to a permission denied page.
    return redirect(REDIRECT_PATHS.PERMISSION_DENIED);
  }

  // --- Render Admin Content ---
  // If execution reaches here, the user is an authorized admin.
  return (
    <div className="container mx-auto p-4">
      {/* Optional: Include the main header if desired */}
      <Header />

      <h1 className="text-3xl font-bold my-6">Admin Dashboard</h1>
      <p>
        Welcome,{' '}
        <span className="font-semibold">{currentUserGitHubUsername}</span>! You
        are authenticated as an admin.
      </p>

      {/*
        Example: Button to trigger a server action or client-side API call
        For actions modifying data, prefer Server Actions that re-verify admin status server-side.
        Any sensitive operation triggered from a client-side handler MUST call
        a Server Action or API route that re-validates authorization on the server.
      */}
      {/* Example using a hypothetical Server Action: */}
      {/*
      <form action={performAdminActionServerAction}>
         <Button type="submit">Perform Admin Action (Server Action)</Button>
      </form>
      */}
      {/* Example client-side trigger (less secure for sensitive operations): */}
      <Button
        onClick={() => {
          // This onClick handler runs on the client-side.
          // For sensitive actions, call a Server Action or API here
          // that performs authorization checks *server-side* again.
          alert(
            'Client-side action triggered. Call a Server Action or API here.',
          );
        }}
      >
        Perform Admin Action (Client Trigger)
      </Button>
    </div>
  );
}
