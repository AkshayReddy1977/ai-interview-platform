import { z } from 'zod';

export const answerEvaluationSchema = z.object({
  technicalAccuracy: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  depth: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  feedback: z.string(),
  suggestedNextDifficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
});

export type AnswerEvaluation = z.infer<typeof answerEvaluationSchema>;

export function buildAnswerEvaluationPrompt(params: {
  question: string;
  expectedTopics: string[];
  answer: string;
  category: string;
  difficulty: string;
}): string {
  return `You are an experienced technical interviewer evaluating a candidate's answer. Be fair but honest — don't inflate scores to be nice, this feedback is meant to genuinely help the candidate improve.

Question (${params.category}, ${params.difficulty} difficulty): "${params.question}"
Topics a strong answer should cover: ${params.expectedTopics.join(', ')}

Candidate's answer:
"""
${params.answer.slice(0, 3000)}
"""

Evaluate the answer and return JSON matching this exact shape:
{
  "technicalAccuracy": number,   // 0-100, is the technical content correct?
  "completeness": number,        // 0-100, did they cover the key points?
  "clarity": number,             // 0-100, how clearly was it communicated?
  "communication": number,       // 0-100, structure and articulation
  "depth": number,               // 0-100, did they go beyond surface-level?
  "confidence": number,          // 0-100, inferred from how the answer is written
  "score": number,               // 0-100, overall score for this answer
  "strengths": string[],         // specific things they did well
  "weaknesses": string[],        // specific gaps or mistakes
  "feedback": string,            // 2-4 sentences of constructive, specific feedback
  "suggestedNextDifficulty": "Beginner" | "Intermediate" | "Advanced" | "Expert"  // what difficulty the NEXT question should be, based on this answer's quality
}`;
}
