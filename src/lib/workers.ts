import { Worker } from 'bullmq';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { generatePrompt } from '@/lib/prompt-generator/promptGenerator';
import { InventoryData } from '@/types/amazon-tools';

export const predictiveInventoryWorker = new Worker(
  'predictiveInventory',
  async (job) => {
    const { inventoryData } = job.data as { inventoryData: InventoryData[] };

    // Construct the prompt for the AI model
    const prompt = generatePrompt({
      category: 'Predictive Inventory Management',
      customCategory: '', // No custom category needed
      context: `Analyze the following Amazon inventory data to predict future demand, identify potential stockouts or overstocking issues, and provide recommendations for optimizing inventory levels. Consider historical sales, current inventory, average daily sales, lead time, and safety stock.

Inventory Data:
${JSON.stringify(inventoryData, null, 2)}`,
      request:
        'Provide a detailed analysis of the inventory data and specific recommendations for each product to optimize inventory levels for the next 30, 60, and 90 days.',
      codeInput: '', // No code input for this task
    });

    // Get AI-driven prediction using the predictive inventory feature config
    const prediction = await getAIDrivenRecommendation(prompt);

    // In a real application, you would store this prediction in your database
    // or send it back to the client via a websocket or other mechanism.
    console.log('Predictive Inventory Analysis Complete:', prediction);

    return prediction;
  },
  {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
);

predictiveInventoryWorker.on('completed', (job) => {
  console.log(`Job with id ${job.id} has completed!`);
});

predictiveInventoryWorker.on('failed', (job, err) => {
  console.error(`Job with id ${job?.id} has failed with error ${err.message}`);
});
