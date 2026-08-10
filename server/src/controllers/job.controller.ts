import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { jobService } from '../services/job.service';
import { AnalyzeJobInput, CreateJobInput } from '../validators/job.validator';

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateJobInput;
  const job = await jobService.create(req.user!.id, input);
  sendSuccess(res, { job }, 'Job description saved and analyzed', 201);
});

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await jobService.listForUser(req.user!.id);
  sendSuccess(res, { jobs }, 'Job descriptions retrieved');
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.getByIdForUser(req.user!.id, req.params.id);
  sendSuccess(res, { job }, 'Job description retrieved');
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  await jobService.deleteForUser(req.user!.id, req.params.id);
  sendSuccess(res, null, 'Job description deleted');
});

export const analyzeJob = asyncHandler(async (req: Request, res: Response) => {
  const { resumeId } = req.body as AnalyzeJobInput;
  const job = await jobService.analyzeAgainstResume(req.user!.id, req.params.id, resumeId);
  sendSuccess(res, { job }, 'Match analysis complete');
});
