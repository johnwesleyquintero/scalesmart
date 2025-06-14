import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchCustomerReviews } from '@/lib/amazon-tools/sp-api';
import { analyzeReviewWithAI } from '@/lib/amazon-tools/reviewAnalysisAI';
import { CustomerReviewData } from '@/app/amazon-seller-tools/components/CustomerReviews';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { asin } = req.query;

    if (!asin || typeof asin !== 'string') {
      return res.status(400).json({ error: 'ASIN is required.' });
    }

    try {
      const fetchedReviews = await fetchCustomerReviews(asin);

      if (fetchedReviews) {
        const reviewsWithAnalysis: CustomerReviewData[] = [];
        for (const review of fetchedReviews as CustomerReviewData[]) {
          const analysis = await analyzeReviewWithAI(review.body);
          reviewsWithAnalysis.push({
            ...review,
            sentiment: analysis?.sentiment,
            themes: analysis?.themes,
          });
        }
        return res.status(200).json(reviewsWithAnalysis);
      } else {
        return res
          .status(500)
          .json({ error: 'Failed to fetch reviews from SP-API.' });
      }
    } catch (error) {
      console.error('API Error fetching or analyzing reviews:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
