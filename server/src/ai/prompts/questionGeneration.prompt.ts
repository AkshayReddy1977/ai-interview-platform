import { z } from 'zod';

export const generatedQuestionSchema = z.object({
  question: z.string(),
  expectedTopics: z.array(z.string()),
  rationale: z.string(), // why this question fits the candidate — not shown to the user, useful for debugging/QA
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export function buildQuestionGenerationPrompt(params: {
  category: string;
  difficulty: string;
  candidateSkills: string[];
  projectTitles: string[];
  jobContext?: string;
  previousQuestions: string[];
}): string {
  return `You are an experienced technical interviewer conducting a mock interview.

Generate ONE interview question in the category "${params.category}" at "${params.difficulty}" difficulty.

Candidate context:
- Known skills: ${params.candidateSkills.join(', ') || 'not specified'}
- Projects: ${params.projectTitles.join(', ') || 'none listed'}
${params.jobContext ? `- Target job context: ${params.jobContext.slice(0, 1000)}` : ''}

Already asked in this session (do NOT repeat these or ask something too similar):
${params.previousQuestions.length > 0 ? params.previousQuestions.map((q) => `- ${q}`).join('\n') : '(none yet)'}

If the category is "Project-based" and the candidate has listed projects, ask specifically about one of their projects. Otherwise, ask a genuine technical/behavioral question appropriate for the category and difficulty — not generic trivia.

Return JSON matching this exact shape:
{
  "question": string,          // the interview question itself, written as you would ask it aloud
  "expectedTopics": string[],  // 2-5 concepts a strong answer should touch on
  "rationale": string          // one sentence on why this question fits this candidate/difficulty
}`;
}
