import { z } from 'zod';

const urlOrEmpty = z
  .string()
  .trim()
  .refine((val) => val === '' || /^https?:\/\/.+/.test(val), { message: 'Must be a valid URL starting with http(s)://' })
  .optional();

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  technologies: z.array(z.string().trim().min(1).max(50)).max(50).default([]),
  features: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  role: z.string().trim().max(150).optional(),
  challenges: z.string().trim().max(2000).optional(),
  solutions: z.string().trim().max(2000).optional(),
  githubUrl: urlOrEmpty,
  liveUrl: urlOrEmpty,
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
