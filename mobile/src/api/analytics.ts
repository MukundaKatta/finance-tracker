import apiClient from './client';
import type {
  SpendingSummary,
  CategoryBreakdown,
  TrendPoint,
  CashFlow,
  ForecastPoint,
  Insight,
} from '@/types';

export const analyticsApi = {
  summary: async (months: number = 1): Promise<SpendingSummary> => {
    const response = await apiClient.get<SpendingSummary>(
      `/analytics/summary?months=${months}`,
    );
    return response.data;
  },

  categoryBreakdown: async (
    months: number = 1,
    type: string = 'expense',
  ): Promise<CategoryBreakdown[]> => {
    const response = await apiClient.get<CategoryBreakdown[]>(
      `/analytics/category-breakdown?months=${months}&transaction_type=${type}`,
    );
    return response.data;
  },

  trends: async (months: number = 6): Promise<TrendPoint[]> => {
    const response = await apiClient.get<TrendPoint[]>(
      `/analytics/trends?months=${months}`,
    );
    return response.data;
  },

  cashFlow: async (months: number = 6): Promise<CashFlow[]> => {
    const response = await apiClient.get<CashFlow[]>(
      `/analytics/cash-flow?months=${months}`,
    );
    return response.data;
  },

  forecast: async (monthsAhead: number = 3): Promise<ForecastPoint[]> => {
    const response = await apiClient.get<ForecastPoint[]>(
      `/analytics/forecast?months_ahead=${monthsAhead}`,
    );
    return response.data;
  },

  insights: async (): Promise<Insight[]> => {
    const response = await apiClient.get<Insight[]>('/analytics/insights');
    return response.data;
  },
};
