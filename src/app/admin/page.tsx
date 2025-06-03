import Header from 'components/header'; // Assuming this path is correct
import { Button } from 'components/ui/button'; // Assuming this path is correct
import { redirect } from 'next/navigation';
// Adjust path and add type import if needed
import { getSupabaseSession } from 'lib/supabase/server';
// Assuming Supabase types are available from the client library (e.g., '@supabase/supabase-js')
import { Session } from '@supabase/supabase-js';

/**
 * Retrieves the list of authorized admin GitHub usernames from environment variables.
 * Splits the comma-separated string, trims whitespace, and filters out empty entries.
 * @returns An array of admin GitHub usernames.
 */
function getAdminUsernames(): string[] {
  const adminUsernamesEnv = process.env.ADMIN_GITHUB_USERNAMES || ''; // e.g., "user1,user2,user3"
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
 * Redirects unauthorized users.
 */
export default async function AdminPage() {
  let session: Session | null = null;
  let sessionError: Error | null = null;

  try {
    // Attempt to retrieve the user session and potential errors
    // Assuming getSupabaseSession returns { data: { session: Session | null } | null, error: Error | null }
    const { data, error } = await getSupabaseSession();
    session = data?.session ?? null; // Safely access session data
    sessionError = error;
  } catch (e: unknown) {
    // Catch any unexpected errors during the getSupabaseSession function call itself (e.g., network issues)
    // Simplified logging to let console.error handle the object type
    console.error('Unexpected error during getSupabaseSession:', e);
    // Redirect on unexpected error during session fetch - removed specific message for security/generality
    return redirect('/error');
  }

  // Handle specific errors returned by getSupabaseSession utility (e.g., misconfiguration)
  if (sessionError) {
    console.error('Error fetching session:', sessionError.message);
    // Redirect on specific error returned by the session utility - removed specific message
    return redirect('/error'); // Or perhaps redirect('/') or redirect('/permission-denied')
  }

  // Retrieve authorized admin usernames
  const adminUsernames = getAdminUsernames();

  // Check if the user is authenticated and if their GitHub username is in the admin list
  // Uses optional chaining for safer access to nested properties.
  const currentUserGitHubUsername = session?.user?.user_metadata?.user_name as
    | string
    | undefined; // Explicitly type for clarity

  if (
    !session?.user || // Check if user exists in session
    !currentUserGitHubUsername || // Check if GitHub username exists in metadata
    !adminUsernames.includes(currentUserGitHubUsername) // Check if username is in admin list
  ) {
    // Log unauthorized access attempt with more details
    console.warn(
      `Unauthorized access attempt to admin page. User ID: ${
        session?.user?.id || 'Unknown'
      }, Email: ${
        session?.user?.email || 'Unknown'
      }, GitHub Username: ${currentUserGitHubUsername || 'Not Provided'}`,
    );
    // If not an authorized admin, redirect them to a permission denied page
    return redirect('/permission-denied'); // More specific redirect than just '/'
  }

  // If it's an authorized admin, show the admin content
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
        Example: Fetching data from Supabase (replace with your actual logic)
        Data fetching for admin pages is typically done within server components
        or dedicated API routes/Server Actions to keep secrets server-side.
      */}
      {/*
      <AdminDataDisplay /> // Example component to fetch and display admin-specific data
      */}

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
          // For sensitive actions, call a Server Action or API route
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
