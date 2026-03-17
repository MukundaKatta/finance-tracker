import apiClient from './client';
import type { Transaction, TransactionCreate, TransactionUpdate } from '@/types';

interface TransactionFilters {
  account_id?: number;
  category_id?: number;
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export const transactionsApi = {
  list: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<Transaction[]>(
      `/transactions/?${params.toString()}`,
    );
    return response.data;
  },

  get: async (id: number): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: TransactionCreate): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions/', data);
    return response.data;
  },

  update: async (id: number, data: TransactionUpdate): Promise<Transaction> => {
    const response = await apiClient.patch<Transaction>(
      `/transactions/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },
};
