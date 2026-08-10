import { z } from 'zod';

export const interviewReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  technicalScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  problemSolvingScore: z.number().min(0).max(100),
  knowledgeDepth: z.number().min(0).max(100),
  strongAreas: z.array(z.string()),
  weakAreas: z.array(z.string()),
  recommendedTopics: z.array(z.string()),
  summary: z.string(),
});

export type InterviewReport = z.infer<typeof interviewReportSchema>;

export function buildInterviewReportPrompt(params: {
  category: string;
  turns: { question: string; answer: string; score: number; strengths: string[]; weaknesses: string[] }[];
}): string {
  const turnsSummary = params.turns
    .map(
      (t, i) =>
        `Q${i + 1} (score ${t.score}/100): ${t.question}\nStrengths: ${t.strengths.join(', ') || 'none noted'}\nWeaknesses: ${t.weaknesses.join(', ') || 'none noted'}`
    )
    .join('\n\n');

  return `You are summarizing a completed mock technical interview in the category "${params.category}" into a final performance report.

Individual question results:
${turnsSummary}

Return JSON matching this exact shape:
{
  "overallScore": number,
  "technicalScore": number,
  "communicationScore": number,
  "problemSolvingScore": number,
  "knowledgeDepth": number,
  "strongAreas": string[],        // recurring strengths across the session
  "weakAreas": string[],          // recurring weaknesses across the session
  "recommendedTopics": string[],  // what to study next, ordered by priority
  "summary": string                // 3-5 sentence overall summary of performance
}`;
}
