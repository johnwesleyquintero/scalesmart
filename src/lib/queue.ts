import { Queue } from 'bullmq';

export const predictiveInventoryQueue = new Queue('predictiveInventory', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});
