import apiClient from './client';
import type { Token, LoginRequest, RegisterRequest, User, UserUpdate } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/register', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateMe: async (data: UserUpdate): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me', data);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password-reset-request', { email });
  },
};
