'use server';

import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }

  return redirect('/');
}

export async function signUp(formData: FormData) {
  const origin = (await headers()).get('origin');
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }

  // Create a profile entry for the new user
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: '',
          avatar_url: '',
        },
      ]);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return redirect('/login?message=Could not create user profile');
    }
  }

  return redirect('/login?message=Check email to continue sign in process');
}
