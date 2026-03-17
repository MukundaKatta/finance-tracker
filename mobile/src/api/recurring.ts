import apiClient from './client';
import type { RecurringTransaction } from '@/types';

interface RecurringCreate {
  account_id: number;
  category_id?: number;
  amount: number;
  description: string;
  frequency: string;
  transaction_type: string;
  next_date: string;
  end_date?: string;
}

interface RecurringUpdate {
  amount?: number;
  description?: string;
  frequency?: string;
  next_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export const recurringApi = {
  list: async (): Promise<RecurringTransaction[]> => {
    const response = await apiClient.get<RecurringTransaction[]>('/recurring/');
    return response.data;
  },

  create: async (data: RecurringCreate): Promise<RecurringTransaction> => {
    const response = await apiClient.post<RecurringTransaction>(
      '/recurring/',
      data,
    );
    return response.data;
  },

  update: async (
    id: number,
    data: RecurringUpdate,
  ): Promise<RecurringTransaction> => {
    const response = await apiClient.patch<RecurringTransaction>(
      `/recurring/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/recurring/${id}`);
  },
};
