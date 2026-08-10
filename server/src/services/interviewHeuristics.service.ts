import { AnswerEvaluation } from '../ai/prompts/answerEvaluation.prompt';
import { InterviewReport } from '../ai/prompts/interviewReport.prompt';
import { Difficulty } from '../data/questionBank';

/**
 * Crude keyword-overlap + length heuristic. This is explicitly a lower-
 * quality fallback for when the AI evaluator is unavailable — it cannot
 * assess actual correctness, only whether the answer engages with the
 * expected topics and has reasonable substance. Every response using
 * this path should be flagged to the client (see Interview.usedFallback).
 */
export function evaluateAnswerHeuristically(params: {
  answer: string;
  expectedTopics: string[];
  currentDifficulty: Difficulty;
}): AnswerEvaluation {
  const answerLower = params.answer.toLowerCase();
  const wordCount = params.answer.trim().split(/\s+/).filter(Boolean).length;

  const topicsCovered = params.expectedTopics.filter((topic) =>
    answerLower.includes(topic.toLowerCase())
  );
  const topicCoverageRatio = params.expectedTopics.length > 0 ? topicsCovered.length / params.expectedTopics.length : 0.5;

  // Length is a weak proxy for completeness/depth, but a near-empty
  // answer is reliably a bad answer, so it's not worthless as a signal.
  const lengthScore = Math.min(100, (wordCount / 80) * 100);

  const completeness = Math.round(topicCoverageRatio * 70 + Math.min(30, lengthScore * 0.3));
  const depth = Math.round(topicCoverageRatio * 60 + Math.min(40, lengthScore * 0.4));
  const technicalAccuracy = Math.round(topicCoverageRatio * 100); // can't verify correctness without AI — topic mention is the only signal
  const clarity = wordCount < 10 ? 30 : wordCount > 300 ? 70 : 80;
  const communication = clarity;
  const confidence = wordCount < 15 ? 40 : 65;

  const score = Math.round((technicalAccuracy + completeness + clarity + communication + depth) / 5);

  const difficultyOrder: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const currentIndex = difficultyOrder.indexOf(params.currentDifficulty);
  let nextIndex = currentIndex;
  if (score >= 75 && currentIndex < difficultyOrder.length - 1) nextIndex = currentIndex + 1;
  else if (score < 40 && currentIndex > 0) nextIndex = currentIndex - 1;

  return {
    technicalAccuracy,
    completeness,
    clarity,
    communication,
    depth,
    confidence,
    score,
    strengths: topicsCovered.length > 0 ? [`Addressed: ${topicsCovered.join(', ')}`] : [],
    weaknesses:
      params.expectedTopics.length > topicsCovered.length
        ? [`Didn't clearly address: ${params.expectedTopics.filter((t) => !topicsCovered.includes(t)).join(', ')}`]
        : [],
    feedback:
      wordCount < 10
        ? "Your answer was very brief. Try to explain your reasoning and cover the key concepts more thoroughly."
        : `Your answer touched on ${topicsCovered.length} of ${params.expectedTopics.length} expected topics. ${
            topicCoverageRatio < 0.5
              ? 'Consider addressing the core concepts more directly.'
              : 'Good coverage of the key concepts — keep building on this level of detail.'
          }`,
    suggestedNextDifficulty: difficultyOrder[nextIndex],
  };
}

export function generateReportHeuristically(params: {
  turns: { score: number; strengths: string[]; weaknesses: string[] }[];
}): InterviewReport {
  if (params.turns.length === 0) {
    return {
      overallScore: 0,
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      knowledgeDepth: 0,
      strongAreas: [],
      weakAreas: [],
      recommendedTopics: [],
      summary: 'No questions were answered in this session.',
    };
  }

  const avg = (nums: number[]) => Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  const scores = params.turns.map((t) => t.score);
  const overallScore = avg(scores);

  const allWeaknesses = params.turns.flatMap((t) => t.weaknesses);
  const allStrengths = params.turns.flatMap((t) => t.strengths);

  return {
    overallScore,
    technicalScore: overallScore,
    communicationScore: overallScore,
    problemSolvingScore: overallScore,
    knowledgeDepth: overallScore,
    strongAreas: Array.from(new Set(allStrengths)).slice(0, 6),
    weakAreas: Array.from(new Set(allWeaknesses)).slice(0, 6),
    recommendedTopics: Array.from(new Set(allWeaknesses)).slice(0, 6),
    summary: `Completed ${params.turns.length} question(s) with an average score of ${overallScore}/100. ${
      overallScore >= 70 ? 'Strong overall performance.' : overallScore >= 40 ? 'Solid foundation with room to grow.' : 'Significant room for improvement — focus on the recommended topics below.'
    }`,
  };
}
