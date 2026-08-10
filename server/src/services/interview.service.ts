import { Interview, IInterview, InterviewStatus } from '../models/Interview.model';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { JobDescription } from '../models/JobDescription.model';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { generateStructured } from '../ai/generateStructured';
import { buildQuestionGenerationPrompt } from '../ai/prompts/questionGeneration.prompt';
import { generatedQuestionSchema } from '../ai/prompts/questionGeneration.prompt';
import { buildAnswerEvaluationPrompt, answerEvaluationSchema } from '../ai/prompts/answerEvaluation.prompt';
import { buildInterviewReportPrompt, interviewReportSchema } from '../ai/prompts/interviewReport.prompt';
import { evaluateAnswerHeuristically, generateReportHeuristically } from './interviewHeuristics.service';
import { pickFallbackQuestion, InterviewCategory, Difficulty } from '../data/questionBank';

async function buildCandidateContext(userId: string, jobId?: string) {
  const [user, projects, job] = await Promise.all([
    User.findById(userId),
    Project.find({ user: userId }).limit(10),
    jobId ? JobDescription.findOne({ _id: jobId, user: userId }) : null,
  ]);

  return {
    skills: user?.skills ?? [],
    projectTitles: projects.map((p) => p.title),
    jobContext: job?.rawText,
  };
}

async function generateNextQuestion(params: {
  category: InterviewCategory;
  difficulty: Difficulty;
  userId: string;
  jobId?: string;
  previousQuestions: string[];
}): Promise<{ question: string; expectedTopics: string[]; usedFallback: boolean }> {
  const context = await buildCandidateContext(params.userId, params.jobId);

  try {
    const generated = await generateStructured(
      buildQuestionGenerationPrompt({
        category: params.category,
        difficulty: params.difficulty,
        candidateSkills: context.skills,
        projectTitles: context.projectTitles,
        jobContext: context.jobContext,
        previousQuestions: params.previousQuestions,
      }),
      generatedQuestionSchema
    );
    return { question: generated.question, expectedTopics: generated.expectedTopics, usedFallback: false };
  } catch (error) {
    logger.warn('AI question generation failed, using fallback bank', { error: (error as Error).message });
    const fallback = pickFallbackQuestion(params.category, params.difficulty, params.previousQuestions);
    return { question: fallback.question, expectedTopics: fallback.expectedTopics, usedFallback: true };
  }
}

export const interviewService = {
  async start(
    userId: string,
    input: { category: InterviewCategory; startingDifficulty?: Difficulty; jobId?: string; resumeId?: string }
  ): Promise<IInterview> {
    const difficulty = input.startingDifficulty ?? 'Beginner';
    const { question, expectedTopics, usedFallback } = await generateNextQuestion({
      category: input.category,
      difficulty,
      userId,
      jobId: input.jobId,
      previousQuestions: [],
    });

    return Interview.create({
      user: userId,
      category: input.category,
      status: InterviewStatus.IN_PROGRESS,
      currentDifficulty: difficulty,
      jobDescription: input.jobId,
      resume: input.resumeId,
      turns: [{ question, expectedTopics, difficulty, askedAt: new Date(), usedFallback }],
    });
  },

  async listForUser(userId: string): Promise<IInterview[]> {
    return Interview.find({ user: userId }).sort({ createdAt: -1 });
  },

  async getByIdForUser(userId: string, interviewId: string): Promise<IInterview> {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) throw AppError.notFound('Interview not found');
    return interview;
  },

  async submitAnswer(userId: string, interviewId: string, answerText: string): Promise<IInterview> {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) throw AppError.notFound('Interview not found');
    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      throw AppError.badRequest('This interview is no longer in progress');
    }

    const currentTurn = interview.turns[interview.turns.length - 1];
    if (!currentTurn) throw AppError.internal('Interview has no active question');
    if (currentTurn.answer) throw AppError.badRequest('This question has already been answered');

    let evaluation;
    let usedFallback = false;
    try {
      evaluation = await generateStructured(
        buildAnswerEvaluationPrompt({
          question: currentTurn.question,
          expectedTopics: currentTurn.expectedTopics,
          answer: answerText,
          category: interview.category,
          difficulty: currentTurn.difficulty,
        }),
        answerEvaluationSchema
      );
    } catch (error) {
      logger.warn('AI answer evaluation failed, using heuristic fallback', { error: (error as Error).message });
      evaluation = evaluateAnswerHeuristically({
        answer: answerText,
        expectedTopics: currentTurn.expectedTopics,
        currentDifficulty: currentTurn.difficulty,
      });
      usedFallback = true;
    }

    currentTurn.answer = answerText;
    currentTurn.answeredAt = new Date();
    currentTurn.evaluation = {
      technicalAccuracy: evaluation.technicalAccuracy,
      completeness: evaluation.completeness,
      clarity: evaluation.clarity,
      communication: evaluation.communication,
      depth: evaluation.depth,
      confidence: evaluation.confidence,
      score: evaluation.score,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      feedback: evaluation.feedback,
    };
    currentTurn.usedFallback = currentTurn.usedFallback || usedFallback;

    // Adaptive difficulty: move toward what the AI/heuristic suggests next.
    interview.currentDifficulty = evaluation.suggestedNextDifficulty;

    await interview.save();
    return interview;
  },

  async nextQuestion(userId: string, interviewId: string): Promise<IInterview> {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) throw AppError.notFound('Interview not found');
    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      throw AppError.badRequest('This interview is no longer in progress');
    }

    const currentTurn = interview.turns[interview.turns.length - 1];
    if (currentTurn && !currentTurn.answer) {
      throw AppError.badRequest('Answer the current question before requesting the next one');
    }

    const MAX_QUESTIONS = 8;
    if (interview.turns.length >= MAX_QUESTIONS) {
      throw AppError.badRequest('This interview has reached its maximum number of questions. Generate the report instead.');
    }

    const { question, expectedTopics, usedFallback } = await generateNextQuestion({
      category: interview.category,
      difficulty: interview.currentDifficulty,
      userId,
      jobId: interview.jobDescription?.toString(),
      previousQuestions: interview.turns.map((t) => t.question),
    });

    interview.turns.push({
      question,
      expectedTopics,
      difficulty: interview.currentDifficulty,
      askedAt: new Date(),
      usedFallback,
    } as IInterview['turns'][number]);

    await interview.save();
    return interview;
  },

  async generateReport(userId: string, interviewId: string): Promise<IInterview> {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) throw AppError.notFound('Interview not found');

    const answeredTurns = interview.turns.filter((t) => t.evaluation);
    if (answeredTurns.length === 0) {
      throw AppError.badRequest('Answer at least one question before generating a report');
    }

    let report;
    try {
      report = await generateStructured(
        buildInterviewReportPrompt({
          category: interview.category,
          turns: answeredTurns.map((t) => ({
            question: t.question,
            answer: t.answer ?? '',
            score: t.evaluation!.score,
            strengths: t.evaluation!.strengths,
            weaknesses: t.evaluation!.weaknesses,
          })),
        }),
        interviewReportSchema
      );
    } catch (error) {
      logger.warn('AI report generation failed, using heuristic fallback', { error: (error as Error).message });
      report = generateReportHeuristically({
        turns: answeredTurns.map((t) => ({
          score: t.evaluation!.score,
          strengths: t.evaluation!.strengths,
          weaknesses: t.evaluation!.weaknesses,
        })),
      });
    }

    interview.report = { ...report, generatedAt: new Date() };
    interview.status = InterviewStatus.COMPLETED;
    interview.completedAt = new Date();
    await interview.save();

    return interview;
  },

  async abandon(userId: string, interviewId: string): Promise<void> {
    const result = await Interview.updateOne(
      { _id: interviewId, user: userId, status: InterviewStatus.IN_PROGRESS },
      { $set: { status: InterviewStatus.ABANDONED } }
    );
    if (result.matchedCount === 0) throw AppError.notFound('Interview not found or already finished');
  },
};
