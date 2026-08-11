import { z } from 'zod';

export const jobExtractionSchema = z.object({
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  experienceRequirement: z.string(),
  educationRequirement: z.string(),
  technologies: z.array(z.string()),
  responsibilities: z.array(z.string()),
});

export type JobExtractionResult = z.infer<typeof jobExtractionSchema>;

export function buildJobExtractionPrompt(jobDescriptionText: string): string {
  return `You are analyzing a job description to extract structured requirements for a technical interview preparation tool.

Extract ONLY information explicitly present in the job description below. Do not invent or infer requirements that aren't stated or strongly implied by the text.

Job description:
"""
${jobDescriptionText}
"""

Return JSON matching this exact shape:
{
  "requiredSkills": string[],       // must-have technical skills explicitly stated
  "preferredSkills": string[],      // nice-to-have / bonus skills
  "experienceRequirement": string,  // e.g. "3-5 years" or "Entry level" — empty string if not stated
  "educationRequirement": string,   // e.g. "Bachelor's in CS or related field" — empty string if not stated
  "technologies": string[],         // specific tools/frameworks/languages mentioned
  "responsibilities": string[]      // key day-to-day responsibilities listed
}`;
}
