import { z } from 'zod';

const educationEntrySchema = z.object({
  institution: z.string().trim().min(1, 'Institution is required').max(200),
  degree: z.string().trim().max(150).optional(),
  fieldOfStudy: z.string().trim().max(150).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().trim().max(1000).optional(),
});

const experienceEntrySchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(200),
  title: z.string().trim().min(1, 'Title is required').max(200),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  current: z.boolean().optional(),
  description: z.string().trim().max(1000).optional(),
});

const urlOrEmpty = z
  .string()
  .trim()
  .refine((val) => val === '' || /^https?:\/\/.+/.test(val), { message: 'Must be a valid URL starting with http(s)://' })
  .optional();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  location: z.string().trim().max(150).optional(),
  bio: z.string().trim().max(1000).optional(),
  education: z.array(educationEntrySchema).max(20).optional(),
  experience: z.array(experienceEntrySchema).max(30).optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(100).optional(),
  github: urlOrEmpty,
  linkedin: urlOrEmpty,
  portfolio: urlOrEmpty,
  // Deliberately no `email`, `role`, `password`, `isActive` — those are
  // never editable through this endpoint. Email changes and password
  // changes get dedicated, more carefully verified flows; role can never
  // be client-set anywhere in this API.
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
