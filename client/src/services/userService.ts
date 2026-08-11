import { apiClient } from './apiClient';
import { ApiEnvelope, AuthUser } from '../types/auth.types';
import { UpdateProfilePayload, UserProfile } from '../types/profile.types';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<ApiEnvelope<{ user: UserProfile }>>('/users/profile');
    return data.data.user;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await apiClient.put<ApiEnvelope<{ user: UserProfile }>>('/users/profile', payload);
    return data.data.user;
  },
};

export type { AuthUser };
