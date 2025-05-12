import { createClient } from '@supabase/supabase-js';
import Header from 'components/header';
import { Button } from 'components/ui/button';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getSession() {
  return await supabase.auth.getSession();
}

export default async function AdminPage() {
  const {
    data: { session },
  } = await getSession();

  // Replace with YOUR GitHub username or other identifier
  const yourGitHubUsername = 'johnwesleyquintero';

  if (
    !session?.user ||
    session.user.user_metadata?.user_name !== yourGitHubUsername
  ) {
    // Not you? Redirect them (e.g., back to the homepage)
    return redirect('/');
  }

  // If it's you, show the admin content
  return (
    <div className="container mx-auto p-4">
      {/* Optional: Include the main header if desired */}
      <Header />

      <h1 className="text-3xl font-bold my-6">Admin Dashboard</h1>
      <p>
        Welcome, {session.user.user_metadata.user_name}! You are authenticated.
      </p>

      {/* Example: Fetching data from Supabase (replace with your actual logic) */}
      {/* {data && (
        <div>
          <h2>Some Data from Supabase:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )} */}

      {/* Example: Button to do something with Supabase (replace) */}
      <Button onClick={() => alert('Do something with Supabase!')}>
        Admin Action
      </Button>
    </div>
  );
}
