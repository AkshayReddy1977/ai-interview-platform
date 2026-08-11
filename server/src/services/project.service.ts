import { IProject, Project } from '../models/Project.model';
import { AppError } from '../utils/AppError';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.validator';

export const projectService = {
  async create(userId: string, input: CreateProjectInput): Promise<IProject> {
    return Project.create({ ...input, user: userId });
  },

  async listForUser(userId: string): Promise<IProject[]> {
    return Project.find({ user: userId }).sort({ createdAt: -1 });
  },

  async getByIdForUser(userId: string, projectId: string): Promise<IProject> {
    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) throw AppError.notFound('Project not found');
    return project;
  },

  async updateForUser(userId: string, projectId: string, input: UpdateProjectInput): Promise<IProject> {
    const project = await Project.findOneAndUpdate({ _id: projectId, user: userId }, { $set: input }, { new: true, runValidators: true });
    if (!project) throw AppError.notFound('Project not found');
    return project;
  },

  async deleteForUser(userId: string, projectId: string): Promise<void> {
    const result = await Project.deleteOne({ _id: projectId, user: userId });
    if (result.deletedCount === 0) throw AppError.notFound('Project not found');
  },
};
