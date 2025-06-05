'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Using Next.js 13/14 router

export function DevLogin() {
  // Check for a client-side accessible environment variable
  // This assumes you have a .env.local file with something like:
  // NEXT_PUBLIC_DEV_LOGIN_ENABLED=true
  const isDevLoginEnabled =
    process.env.NEXT_PUBLIC_DEV_LOGIN_ENABLED === 'true';

  const router = useRouter();

  // If dev login is not enabled, don't render anything
  if (!isDevLoginEnabled) {
    return null;
  }

  // Use a function component for better structure
  const handleDevLogin = () => {
    // In a real scenario, you might set a dev cookie or local storage flag
    // to simulate login state for development purposes without a backend call.
    // For this simple bypass, we just redirect.
    console.log('Attempting development login bypass...');

    // Use Next.js router for navigation
    router.push('/admin');

    // Optionally add a small delay or state update if needed for UI feedback
    // For this bypass, instant redirect is fine.
  };

  // Use consistent className formatting (e.g., Tailwind CSS)
  // Ensure ARIA attributes or better accessibility if needed (though low priority for a dev-only feature)
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50 shadow-sm max-w-sm mx-auto mt-8">
      <h3 className="font-bold text-lg text-yellow-800 mb-3">
        Development Login Bypass
      </h3>
      <p className="text-sm text-yellow-700 mb-4">
        This section is only visible in development environments when enabled
        via configuration. It allows direct access to the admin area for testing
        purposes.
      </p>
      {/* Example static dev credentials - remove or make dynamic if sensitive */}
      <div className="text-xs text-gray-600 mb-4">
        <p>Simulated User: admin@scalesmart.com</p>
        <p>Simulated Password: Devpassword123!</p>{' '}
        {/* Warning: Avoid hardcoding real secrets */}
      </div>

      <button
        onClick={handleDevLogin}
        // Add hover/active states for better UX
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
        aria-label="Login as Developer to bypass authentication"
      >
        Access Admin (Dev Bypass)
      </button>
    </div>
  );
}
