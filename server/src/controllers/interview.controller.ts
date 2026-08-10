import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { interviewService } from '../services/interview.service';
import { StartInterviewInput, SubmitAnswerInput } from '../validators/interview.validator';
import { InterviewCategory, Difficulty } from '../data/questionBank';

export const startInterview = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as StartInterviewInput;
  const interview = await interviewService.start(req.user!.id, {
    category: input.category as InterviewCategory,
    startingDifficulty: input.startingDifficulty as Difficulty | undefined,
    jobId: input.jobId,
    resumeId: input.resumeId,
  });
  sendSuccess(res, { interview }, 'Interview started', 201);
});

export const listInterviews = asyncHandler(async (req: Request, res: Response) => {
  const interviews = await interviewService.listForUser(req.user!.id);
  sendSuccess(res, { interviews }, 'Interviews retrieved');
});

export const getInterview = asyncHandler(async (req: Request, res: Response) => {
  const interview = await interviewService.getByIdForUser(req.user!.id, req.params.id);
  sendSuccess(res, { interview }, 'Interview retrieved');
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { answer } = req.body as SubmitAnswerInput;
  const interview = await interviewService.submitAnswer(req.user!.id, req.params.id, answer);
  sendSuccess(res, { interview }, 'Answer evaluated');
});

export const nextQuestion = asyncHandler(async (req: Request, res: Response) => {
  const interview = await interviewService.nextQuestion(req.user!.id, req.params.id);
  sendSuccess(res, { interview }, 'Next question generated');
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const interview = await interviewService.generateReport(req.user!.id, req.params.id);
  sendSuccess(res, { interview }, 'Report generated');
});

export const abandonInterview = asyncHandler(async (req: Request, res: Response) => {
  await interviewService.abandon(req.user!.id, req.params.id);
  sendSuccess(res, null, 'Interview abandoned');
});
