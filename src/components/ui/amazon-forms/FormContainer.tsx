import { ReactNode } from 'react';

export const FormContainer = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
    </label>

    <div className="relative">
      {children}

      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  </div>
);
