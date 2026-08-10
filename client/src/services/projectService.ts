import { apiClient } from './apiClient';
import { ApiEnvelope } from '../types/auth.types';
import { CreateProjectPayload, Project } from '../types/jobProject.types';

export const projectService = {
  async create(payload: CreateProjectPayload): Promise<Project> {
    const { data } = await apiClient.post<ApiEnvelope<{ project: Project }>>('/projects', payload);
    return data.data.project;
  },

  async list(): Promise<Project[]> {
    const { data } = await apiClient.get<ApiEnvelope<{ projects: Project[] }>>('/projects');
    return data.data.projects;
  },

  async update(id: string, payload: Partial<CreateProjectPayload>): Promise<Project> {
    const { data } = await apiClient.put<ApiEnvelope<{ project: Project }>>(`/projects/${id}`, payload);
    return data.data.project;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },
};
