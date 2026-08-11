import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { projectService } from '../services/project.service';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.validator';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.create(req.user!.id, req.body as CreateProjectInput);
  sendSuccess(res, { project }, 'Project created', 201);
});

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.listForUser(req.user!.id);
  sendSuccess(res, { projects }, 'Projects retrieved');
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getByIdForUser(req.user!.id, req.params.id);
  sendSuccess(res, { project }, 'Project retrieved');
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.updateForUser(req.user!.id, req.params.id, req.body as UpdateProjectInput);
  sendSuccess(res, { project }, 'Project updated');
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteForUser(req.user!.id, req.params.id);
  sendSuccess(res, null, 'Project deleted');
});
