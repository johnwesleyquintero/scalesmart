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
