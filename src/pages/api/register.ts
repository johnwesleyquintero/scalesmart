import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email and password are required.' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is not defined.');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });

  try {
    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase auth sign-up error:', authError.message);
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ message: 'User creation failed.' });
    }

    // Create a profile entry for the new user
    const profileData = {
      id: authData.user.id,
      email: authData.user.email,
      has_amazon_access: false, // Default to false, access granted by admin
      // Add other default profile fields as necessary
    };
    console.log('Creating profile with data:', profileData);
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error(
        'Supabase profile creation error:',
        profileError.message,
        JSON.stringify(profileError),
      );
      // If profile creation fails, you might want to delete the user from auth as well
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        message: 'Failed to create user profile. ' + profileError.message,
      });
    }

    return res.status(200).json({
      message:
        'Registration successful. Please check your email to verify your account.',
    });
  } catch (error: unknown) {
    console.error('Unexpected registration error:', (error as Error).message);
    return res
      .status(500)
      .json({ message: 'An unexpected error occurred during registration.' });
  }
}
