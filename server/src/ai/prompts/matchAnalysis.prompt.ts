import { z } from 'zod';

export const matchAnalysisSchema = z.object({
  overallMatchScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  weakAreas: z.array(z.string()),
  experienceGaps: z.array(z.string()),
  technologyGaps: z.array(z.string()),
  recommendedPreparationTopics: z.array(z.string()),
});

export type MatchAnalysisResult = z.infer<typeof matchAnalysisSchema>;

export function buildMatchAnalysisPrompt(params: {
  resumeSkills: string[];
  resumeText: string;
  jobRequiredSkills: string[];
  jobPreferredSkills: string[];
  jobText: string;
}): string {
  return `You are comparing a candidate's resume against a job description for a technical interview preparation tool. Be honest and specific — this analysis directly shapes what the candidate studies before their interview, so don't inflate the score or invent matches that aren't really there.

Candidate's known skills: ${params.resumeSkills.join(', ') || 'none extracted'}

Candidate's resume text (may be partial):
"""
${params.resumeText.slice(0, 4000)}
"""

Job's required skills: ${params.jobRequiredSkills.join(', ') || 'none extracted'}
Job's preferred skills: ${params.jobPreferredSkills.join(', ') || 'none extracted'}

Job description text:
"""
${params.jobText.slice(0, 4000)}
"""

Return JSON matching this exact shape:
{
  "overallMatchScore": number,              // 0-100, how well the resume matches this job
  "matchedSkills": string[],                // skills the candidate has that the job wants
  "missingSkills": string[],                // skills the job wants that the candidate doesn't show
  "weakAreas": string[],                    // areas where the candidate has some but shallow experience
  "experienceGaps": string[],               // experience-level mismatches (e.g. "job wants 5 years, resume shows 2")
  "technologyGaps": string[],               // specific tools/frameworks the job needs that are absent
  "recommendedPreparationTopics": string[]  // concrete topics to study before interviewing, ordered by priority
}`;
}
