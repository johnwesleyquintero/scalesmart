import { connectToDatabase } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await connectToDatabase();
    res.status(200).json({ message: 'Connected to Supabase database' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
