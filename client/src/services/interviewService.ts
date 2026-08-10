import { apiClient } from './apiClient';
import { ApiEnvelope } from '../types/auth.types';
import { Interview, InterviewCategory, Difficulty } from '../types/interview.types';

export const interviewService = {
  async start(payload: { category: InterviewCategory; startingDifficulty?: Difficulty; jobId?: string; resumeId?: string }): Promise<Interview> {
    const { data } = await apiClient.post<ApiEnvelope<{ interview: Interview }>>('/interviews', payload);
    return data.data.interview;
  },

  async list(): Promise<Interview[]> {
    const { data } = await apiClient.get<ApiEnvelope<{ interviews: Interview[] }>>('/interviews');
    return data.data.interviews;
  },

  async getById(id: string): Promise<Interview> {
    const { data } = await apiClient.get<ApiEnvelope<{ interview: Interview }>>(`/interviews/${id}`);
    return data.data.interview;
  },

  async submitAnswer(id: string, answer: string): Promise<Interview> {
    const { data } = await apiClient.post<ApiEnvelope<{ interview: Interview }>>(`/interviews/${id}/answer`, { answer });
    return data.data.interview;
  },

  async nextQuestion(id: string): Promise<Interview> {
    const { data } = await apiClient.post<ApiEnvelope<{ interview: Interview }>>(`/interviews/${id}/next-question`);
    return data.data.interview;
  },

  async getReport(id: string): Promise<Interview> {
    const { data } = await apiClient.get<ApiEnvelope<{ interview: Interview }>>(`/interviews/${id}/report`);
    return data.data.interview;
  },
};
