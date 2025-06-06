import { z } from 'zod';

export const ModuleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  description: z.string().min(1, 'Module description is required'),
  duration: z.string().optional(),
  videoUrl: z.string().url('Invalid video URL').optional(),
  content: z.string().optional(),
});

export const CourseMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.string().optional(),
  level: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  interactive: z.boolean().optional(),
});

export const CourseDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  modules: z.array(ModuleSchema).min(1, 'At least one module is required'),
  duration: z.string().optional(),
  level: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  interactive: z.boolean().optional(),
  content: z.string().optional(), // The main MDX content
});

export type CourseData = z.infer<typeof CourseDataSchema>;
export type CourseMetadata = z.infer<typeof CourseMetadataSchema>;
export type Module = z.infer<typeof ModuleSchema>;
