import apiClient from './client';
import type { Account, AccountCreate, AccountUpdate } from '@/types';

export const accountsApi = {
  list: async (): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>('/accounts/');
    return response.data;
  },

  get: async (id: number): Promise<Account> => {
    const response = await apiClient.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  create: async (data: AccountCreate): Promise<Account> => {
    const response = await apiClient.post<Account>('/accounts/', data);
    return response.data;
  },

  update: async (id: number, data: AccountUpdate): Promise<Account> => {
    const response = await apiClient.patch<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },
};
