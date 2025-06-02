import Header from 'components/header'; // Assuming this path is correct
import { Button } from 'components/ui/button'; // Assuming this path is correct
import { redirect } from 'next/navigation';
import { getSupabaseSession } from 'lib/supabase/server'; // Adjust path if needed

/**
 * Retrieves the list of authorized admin GitHub usernames from environment variables.
 * @returns {string[]} An array of admin GitHub usernames.
 */
function getAdminUsernames(): string[] {
  const adminUsernamesEnv = process.env.ADMIN_GITHUB_USERNAMES || ''; // e.g., "user1,user2,user3"
  return adminUsernamesEnv
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * AdminPage component.
 * This page is protected and only accessible to users whose GitHub username
 * is listed in the ADMIN_GITHUB_USERNAMES environment variable.
 */
export default async function AdminPage() {
  let session;
  try {
    // Attempt to retrieve the user session
    const { data, error } = await getSupabaseSession();
    if (error) {
      console.error('Error fetching session:', error.message);
      // If there's an error fetching the session, redirect to home or an error page
      return redirect('/');
    }
    session = data.session;
  } catch (e: unknown) {
    // Catch any unexpected errors during session retrieval
    console.error(
      'Unexpected error during getSession:',
      e instanceof Error ? e.message : 'An unknown error occurred',
    );
    return redirect('/error?message=session_retrieval_failed'); // Or simply redirect('/')
  }

  const adminUsernames = getAdminUsernames();

  // Check if the user is authenticated and if their GitHub username is in the admin list
  // Uses optional chaining for safer access to nested properties.
  const currentUserGitHubUsername = session?.user?.user_metadata?.user_name;

  if (
    !session?.user ||
    !currentUserGitHubUsername ||
    !adminUsernames.includes(currentUserGitHubUsername)
  ) {
    // If not an authorized admin, redirect them (e.g., back to the homepage)
    console.warn(
      `Unauthorized access attempt to admin page. User: ${
        session?.user?.email || 'Unknown'
      }, GitHub Username: ${currentUserGitHubUsername || 'Not Provided'}`,
    );
    return redirect('/');
  }

  // If it's an authorized admin, show the admin content
  return (
    <div className="container mx-auto p-4">
      {/* Optional: Include the main header if desired */}
      <Header />

      <h1 className="text-3xl font-bold my-6">Admin Dashboard</h1>
      <p>
        Welcome, {currentUserGitHubUsername}! You are authenticated as an admin.
      </p>

      {/*
        Example: Fetching data from Supabase (replace with your actual logic)
        You would typically create another async function to fetch data here,
        or pass the supabase client instance if needed.
      */}
      {/*
      {data && (
        <div>
          <h2>Some Data from Supabase:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      */}

      {/*
        Example: Button to trigger a server action or client-side API call
        For server actions, ensure they also perform necessary auth checks.
      */}
      <Button
        onClick={() => {
          // This onClick handler runs on the client-side.
          // For actions modifying data, prefer Server Actions or API routes.
          alert('Admin action triggered! Implement your Supabase logic here.');
        }}
      >
        Perform Admin Action
      </Button>
    </div>
  );
}
