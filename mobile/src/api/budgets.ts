import apiClient from './client';
import type { Budget, BudgetWithSpent, BudgetCreate } from '@/types';

export const budgetsApi = {
  list: async (): Promise<BudgetWithSpent[]> => {
    const response = await apiClient.get<BudgetWithSpent[]>('/budgets/');
    return response.data;
  },

  create: async (data: BudgetCreate): Promise<Budget> => {
    const response = await apiClient.post<Budget>('/budgets/', data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<BudgetCreate>,
  ): Promise<Budget> => {
    const response = await apiClient.patch<Budget>(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/budgets/${id}`);
  },
};
