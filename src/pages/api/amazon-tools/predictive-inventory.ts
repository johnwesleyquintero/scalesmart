import { NextApiRequest, NextApiResponse } from 'next';
import { InventoryData } from '@/types/amazon-tools';
import { predictiveInventoryQueue } from '@/lib/queue';
import { Job } from 'bullmq';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { inventoryData } = req.body as { inventoryData: InventoryData[] };

    if (
      !inventoryData ||
      !Array.isArray(inventoryData) ||
      inventoryData.length === 0
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid or empty inventory data provided.' });
    }

    const job: Job = await predictiveInventoryQueue.add(
      'predictiveInventoryJob',
      { inventoryData },
      { removeOnComplete: true, removeOnFail: false },
    );

    res
      .status(202)
      .json({ jobId: job.id, message: 'Job enqueued successfully' });
  } catch (error) {
    console.error('Error in predictive inventory API:', error);
    res.status(500).json({
      error: `Failed to get predictive inventory analysis: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
