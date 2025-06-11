import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeCompetitorDataAI } from '@/lib/amazon-tools/competitorMonitoringAI';
import { CompetitorMonitoringData } from '@/types/amazon-tools';
import { handleApiError } from '@/lib/api-error-handler';

export default handleApiError(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
      const { competitorData } = req.body as {
        competitorData: CompetitorMonitoringData[];
      };

      if (!competitorData || !Array.isArray(competitorData)) {
        return res
          .status(400)
          .json({ error: 'Invalid input: competitorData array is required.' });
      }

      const analysis = await analyzeCompetitorDataAI(competitorData);

      res.status(200).json({ analysis });
    } catch (error) {
      console.error('Error in competitor monitoring analysis API:', error);
      // apiErrorHandler will handle the response
      throw error;
    }
  },
);
