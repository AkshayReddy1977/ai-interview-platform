import { apiClient } from './apiClient';
import { ApiEnvelope } from '../types/auth.types';
import { Resume } from '../types/profile.types';

export const resumeService = {
  async upload(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('resume', file);
    const { data } = await apiClient.post<ApiEnvelope<{ resume: Resume }>>('/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.resume;
  },

  async list(): Promise<Resume[]> {
    const { data } = await apiClient.get<ApiEnvelope<{ resumes: Resume[] }>>('/resumes');
    return data.data.resumes;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/resumes/${id}`);
  },
};
