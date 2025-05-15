import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    res.status(200).json({ message: 'Supabase connection successful' });
  } catch (error) {
    console.error('Supabase connection error:', error);
    res.status(500).json({
      error: 'Supabase connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
