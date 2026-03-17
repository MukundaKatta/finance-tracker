import apiClient from './client';
import type {
  SavingsGoal,
  SavingsGoalWithProgress,
  SavingsGoalCreate,
  SavingsGoalUpdate,
} from '@/types';

export const savingsApi = {
  list: async (): Promise<SavingsGoalWithProgress[]> => {
    const response = await apiClient.get<SavingsGoalWithProgress[]>(
      '/savings-goals/',
    );
    return response.data;
  },

  create: async (data: SavingsGoalCreate): Promise<SavingsGoal> => {
    const response = await apiClient.post<SavingsGoal>(
      '/savings-goals/',
      data,
    );
    return response.data;
  },

  update: async (
    id: number,
    data: SavingsGoalUpdate,
  ): Promise<SavingsGoal> => {
    const response = await apiClient.patch<SavingsGoal>(
      `/savings-goals/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/savings-goals/${id}`);
  },
};
