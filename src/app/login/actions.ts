'use server';

import { redirect } from 'next/navigation';

const TEST_USER_EMAIL = 'scalesmart.tester@example.com';
const TEST_USER_PASSWORD = 'ScaleSmartTest@2024!';

export async function authenticate(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email === TEST_USER_EMAIL && password === TEST_USER_PASSWORD) {
    // In a real application, you would set a session here.
    // For this example, we'll just redirect to a protected route.
    console.log('Login successful');
    const PROTECTED_ROUTES = [
      '/admin',
      '/crm',
      '/profile',
      '/project-management',
      '/ats',
      '/amazon-seller-tools',
    ];

    const redirectTo = PROTECTED_ROUTES[0] || '/admin';
    redirect(redirectTo);
  } else {
    return { message: 'Invalid credentials.' };
  }
}
