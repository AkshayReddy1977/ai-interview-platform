import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { resumeService } from '../services/resume.service';

export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No file uploaded. Attach a PDF under the "resume" field.');
  }
  const resume = await resumeService.upload(req.user!.id, req.file);
  sendSuccess(res, { resume }, 'Resume uploaded and processed', 201);
});

export const listResumes = asyncHandler(async (req: Request, res: Response) => {
  const resumes = await resumeService.listForUser(req.user!.id);
  sendSuccess(res, { resumes }, 'Resumes retrieved');
});

export const getResume = asyncHandler(async (req: Request, res: Response) => {
  const resume = await resumeService.getByIdForUser(req.user!.id, req.params.id);
  sendSuccess(res, { resume }, 'Resume retrieved');
});

export const deleteResume = asyncHandler(async (req: Request, res: Response) => {
  await resumeService.deleteForUser(req.user!.id, req.params.id);
  sendSuccess(res, null, 'Resume deleted');
});
