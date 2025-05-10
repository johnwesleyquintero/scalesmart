'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function AuthDisplay() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('authBannerDismissed');
    if (dismissed) setIsVisible(false);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('authBannerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-blue-600 hover:text-blue-800"
      >
        <X size={18} />
      </button>

      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        Unified Authentication Platform
      </h3>

      <p className="text-blue-700 mb-4">
        This account is secured with enterprise-grade authentication. Your
        credentials are securely managed through our GitHub OAuth integration
        and can be used across all WesCode applications.
      </p>

      <div className="flex items-center gap-4">
        <Link href="/privacy" className="text-blue-600 hover:underline text-sm">
          View Privacy Policy
        </Link>
        <span className="text-blue-300">|</span>
        <div className="flex gap-2">
          <Image
            src="/images/github-mark.svg"
            alt="GitHub Logo"
            width={20}
            height={20}
            className="h-5 w-5"
          />
          <Image
            src="/images/linkedin.svg"
            alt="LinkedIn Logo"
            width={20}
            height={20}
            className="h-5 w-5"
          />
        </div>
      </div>
    </div>
  );
}
