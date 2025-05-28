import { z } from 'zod';

export const resumeAnalysisSchema = z.object({
  file: z
    .instanceof(Blob, { message: 'File is required.' })
    .refine((file) => file.size > 0, 'File cannot be empty.')
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB.',
    ) // 5MB limit
    .refine(
      (file) =>
        [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(file.type),
      'Only PDF and DOCX files are allowed.',
    ),
});

export const moduleProgressSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  courseId: z.string().min(1, 'Course ID is required.'),
  moduleId: z.string().min(1, 'Module ID is required.'),
  progress: z.number().min(0, 'Progress cannot be negative.').max(100, 'Progress cannot exceed 100.'),
});
