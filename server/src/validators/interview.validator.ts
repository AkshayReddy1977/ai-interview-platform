import { z } from 'zod';
import { DIFFICULTIES, INTERVIEW_CATEGORIES } from '../data/questionBank';

export const startInterviewSchema = z.object({
  category: z.enum(INTERVIEW_CATEGORIES as [string, ...string[]]),
  startingDifficulty: z.enum(DIFFICULTIES as [string, ...string[]]).optional(),
  jobId: z.string().trim().optional(),
  resumeId: z.string().trim().optional(),
});

export const submitAnswerSchema = z.object({
  answer: z.string().trim().min(1, 'Answer cannot be empty').max(8000),
});

export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
