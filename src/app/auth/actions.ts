'use server';

import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Handles user sign-in using email and password.
 * Validates input and redirects based on authentication result.
 *
 * @param formData - The FormData object containing email and password.
 */
export async function signIn(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  // Basic input validation: Ensure email and password are provided strings
  if (
    !email ||
    typeof email !== 'string' ||
    !password ||
    typeof password !== 'string'
  ) {
    // Redirect with a user-friendly error message if input is missing or invalid
    return redirect('/login?message=Email and password are required.');
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email, // Now safe to use as checked above
    password, // Now safe to use as checked above
  });

  if (error) {
    // Log the specific error on the server for debugging, but provide a generic message to the user
    console.error('Supabase sign-in error:', error);
    // Keep the message generic to prevent user enumeration
    return redirect('/login?message=Invalid credentials.');
  }

  // Redirect to the dashboard or homepage on successful sign-in
  return redirect('/');
}

/**
 * Handles user sign-up using email and password.
 * Validates input, creates the user, and attempts to create a profile entry.
 * Redirects based on the outcome.
 *
 * @param formData - The FormData object containing email and password.
 */
export async function signUp(formData: FormData) {
  const origin = (await headers()).get('origin');
  const email = formData.get('email');
  const password = formData.get('password');

  // Basic input validation: Ensure email and password are provided strings
  if (
    !email ||
    typeof email !== 'string' ||
    !password ||
    typeof password !== 'string'
  ) {
    // Redirect with a user-friendly error message if input is missing or invalid
    return redirect('/login?message=Email and password are required.');
  }

  const supabase = await createClient();

  // Attempt to sign up the user with email and password
  const { data, error: signUpError } = await supabase.auth.signUp({
    email, // Now safe to use as checked above
    password, // Now safe to use as checked above
    options: {
      // Email confirmation redirect URL
      emailRedirectTo: '',
    },
  });

  if (signUpError) {
    // Log the specific sign-up error on the server
    console.error('Supabase sign-up error:', signUpError);
    // Provide a generic message to the user (could be invalid format, duplicate user, etc.)
    // Avoid mentioning "duplicate user" specifically to prevent enumeration
    return redirect(
      '/login?message=Sign up failed. Please check your details or try again.',
    );
  }

  // If sign-up was successful and a user object is returned
  if (data.user) {
    // Attempt to create a profile entry for the new user
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: data.user.id,
        email: data.user.email,
        // Initialize profile fields (consider making these non-nullable in DB if possible)
        full_name: '', // Assuming these start empty and are filled later
        avatar_url: '',
      },
    ]);

    if (profileError) {
      // Log the specific profile creation error on the server
      console.error('Error creating user profile:', profileError);
      // Redirect with an error message specific to profile creation failure
      // Note: User account exists, but profile failed. Application logic needs to handle this state.
      return redirect(
        '/login?message=Account created, but profile creation failed. Please contact support.',
      );
    }
  } else {
    // This case should ideally not happen if signUp is successful but might
    // indicate an unexpected response structure from Supabase.
    console.warn('Sign up successful but no user object returned:', data);
    // Redirect with a general error message if user data is missing after successful signup
    return redirect(
      '/login?message=Sign up process incomplete. Please try again.',
    );
  }

  // Redirect on successful sign-up to the homepage
  return redirect('/');
}

/**
 * Handles sending a password reset email.
 * Validates input and redirects based on the outcome.
 *
 * @param formData - The FormData object containing the email.
 */
export async function forgotPassword(formData: FormData) {
  const email = formData.get('email');
  const origin = (await headers()).get('origin');

  // Basic input validation: Ensure email is a provided string
  if (!email || typeof email !== 'string') {
    // Redirect with a user-friendly error message if input is missing or invalid
    return redirect('/login?message=Email is required to reset password.');
  }

  const supabase = await createClient();

  // Attempt to send the password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Redirect URL after the user clicks the link in the email
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    // Log the specific Supabase error on the server for debugging
    console.error('Supabase password reset error:', error);
    // Provide a generic, safe message to the user, regardless of the specific error
    // This prevents revealing whether an email exists or not, mitigating enumeration attacks
    // A slightly more user-friendly message confirms *an attempt* was made without confirming success
    return redirect(
      '/login?message=If an account with that email exists, a password reset link has been sent.',
    );
  }

  // Redirect with a success message instructing the user to check their email
  return redirect(
    '/login?message=Password reset email sent. Please check your inbox.',
  );
}
