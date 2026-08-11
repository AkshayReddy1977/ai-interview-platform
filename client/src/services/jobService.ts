import { apiClient } from './apiClient';
import { ApiEnvelope } from '../types/auth.types';
import { CreateJobPayload, JobDescription } from '../types/jobProject.types';

export const jobService = {
  async create(payload: CreateJobPayload): Promise<JobDescription> {
    const { data } = await apiClient.post<ApiEnvelope<{ job: JobDescription }>>('/jobs', payload);
    return data.data.job;
  },

  async list(): Promise<JobDescription[]> {
    const { data } = await apiClient.get<ApiEnvelope<{ jobs: JobDescription[] }>>('/jobs');
    return data.data.jobs;
  },

  async getById(id: string): Promise<JobDescription> {
    const { data } = await apiClient.get<ApiEnvelope<{ job: JobDescription }>>(`/jobs/${id}`);
    return data.data.job;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/jobs/${id}`);
  },

  async analyze(id: string, resumeId: string): Promise<JobDescription> {
    const { data } = await apiClient.post<ApiEnvelope<{ job: JobDescription }>>(`/jobs/${id}/analyze`, { resumeId });
    return data.data.job;
  },
};
