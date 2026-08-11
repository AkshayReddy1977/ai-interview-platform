import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  company: z.string().trim().max(200).optional(),
  rawText: z.string().trim().min(20, 'Job description text is too short to analyze').max(20000),
});

export const analyzeJobSchema = z.object({
  resumeId: z.string().trim().min(1, 'resumeId is required'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type AnalyzeJobInput = z.infer<typeof analyzeJobSchema>;
