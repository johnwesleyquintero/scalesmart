import { z } from 'zod';

export const moduleProgressSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  courseId: z.string().min(1, 'Course ID is required.'),
  moduleId: z.string().min(1, 'Module ID is required.'),
  progress: z
    .number()
    .min(0, 'Progress cannot be negative.')
    .max(100, 'Progress cannot exceed 100.'),
});
