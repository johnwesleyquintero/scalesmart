import '@testing-library/jest-dom';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-anon-key';

console.log('test/setup.ts is being executed');
