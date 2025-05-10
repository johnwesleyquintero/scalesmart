declare global {
  // Add proper typing for global objects
  interface Window {
    localStorage: Storage;
  }

  // Add proper typing for template literal expressions
  type ValidTemplateValue = string | number | boolean | null | undefined;

  // Add proper typing for any values that need strict typing
  interface TypedResponse<T> {
    data: T;
    status: number;
    message: string;
  }

  // Add proper typing for API responses
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
}

export {};

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
