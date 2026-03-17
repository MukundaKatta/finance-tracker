import { create } from 'zustand';
import { accountsApi, transactionsApi, categoriesApi, budgetsApi, savingsApi, analyticsApi, recurringApi } from '@/api';
import type {
  Account,
  Transaction,
  Category,
  BudgetWithSpent,
  SavingsGoalWithProgress,
  RecurringTransaction,
  SpendingSummary,
  CategoryBreakdown,
  TrendPoint,
  Insight,
  ForecastPoint,
  TransactionCreate,
  AccountCreate,
  BudgetCreate,
  SavingsGoalCreate,
  SavingsGoalUpdate,
} from '@/types';

interface FinanceState {
  // Data
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: BudgetWithSpent[];
  savingsGoals: SavingsGoalWithProgress[];
  recurring: RecurringTransaction[];
  summary: SpendingSummary | null;
  categoryBreakdown: CategoryBreakdown[];
  trends: TrendPoint[];
  insights: Insight[];
  forecast: ForecastPoint[];

  // Loading states
  loadingAccounts: boolean;
  loadingTransactions: boolean;
  loadingBudgets: boolean;
  loadingGoals: boolean;
  loadingAnalytics: boolean;

  // Actions
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (filters?: Record<string, any>) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchSavingsGoals: () => Promise<void>;
  fetchRecurring: () => Promise<void>;
  fetchSummary: (months?: number) => Promise<void>;
  fetchCategoryBreakdown: (months?: number) => Promise<void>;
  fetchTrends: (months?: number) => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchForecast: (months?: number) => Promise<void>;
  fetchDashboard: () => Promise<void>;

  // Mutations
  createTransaction: (data: TransactionCreate) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<void>;
  createAccount: (data: AccountCreate) => Promise<Account>;
  deleteAccount: (id: number) => Promise<void>;
  createBudget: (data: BudgetCreate) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
  createSavingsGoal: (data: SavingsGoalCreate) => Promise<void>;
  updateSavingsGoal: (id: number, data: SavingsGoalUpdate) => Promise<void>;
  deleteSavingsGoal: (id: number) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  savingsGoals: [],
  recurring: [],
  summary: null,
  categoryBreakdown: [],
  trends: [],
  insights: [],
  forecast: [],

  loadingAccounts: false,
  loadingTransactions: false,
  loadingBudgets: false,
  loadingGoals: false,
  loadingAnalytics: false,

  fetchAccounts: async () => {
    set({ loadingAccounts: true });
    try {
      const accounts = await accountsApi.list();
      set({ accounts, loadingAccounts: false });
    } catch {
      set({ loadingAccounts: false });
    }
  },

  fetchTransactions: async (filters) => {
    set({ loadingTransactions: true });
    try {
      const transactions = await transactionsApi.list(filters);
      set({ transactions, loadingTransactions: false });
    } catch {
      set({ loadingTransactions: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await categoriesApi.list();
      set({ categories });
    } catch {
      // silently fail
    }
  },

  fetchBudgets: async () => {
    set({ loadingBudgets: true });
    try {
      const budgets = await budgetsApi.list();
      set({ budgets, loadingBudgets: false });
    } catch {
      set({ loadingBudgets: false });
    }
  },

  fetchSavingsGoals: async () => {
    set({ loadingGoals: true });
    try {
      const savingsGoals = await savingsApi.list();
      set({ savingsGoals, loadingGoals: false });
    } catch {
      set({ loadingGoals: false });
    }
  },

  fetchRecurring: async () => {
    try {
      const recurring = await recurringApi.list();
      set({ recurring });
    } catch {
      // silently fail
    }
  },

  fetchSummary: async (months = 1) => {
    try {
      const summary = await analyticsApi.summary(months);
      set({ summary });
    } catch {
      // silently fail
    }
  },

  fetchCategoryBreakdown: async (months = 1) => {
    try {
      const categoryBreakdown = await analyticsApi.categoryBreakdown(months);
      set({ categoryBreakdown });
    } catch {
      // silently fail
    }
  },

  fetchTrends: async (months = 6) => {
    try {
      const trends = await analyticsApi.trends(months);
      set({ trends });
    } catch {
      // silently fail
    }
  },

  fetchInsights: async () => {
    try {
      const insights = await analyticsApi.insights();
      set({ insights });
    } catch {
      // silently fail
    }
  },

  fetchForecast: async (months = 3) => {
    try {
      const forecast = await analyticsApi.forecast(months);
      set({ forecast });
    } catch {
      // silently fail
    }
  },

  fetchDashboard: async () => {
    set({ loadingAnalytics: true });
    await Promise.all([
      get().fetchAccounts(),
      get().fetchSummary(),
      get().fetchTransactions({ limit: 5 }),
      get().fetchBudgets(),
      get().fetchInsights(),
      get().fetchCategories(),
    ]);
    set({ loadingAnalytics: false });
  },

  createTransaction: async (data) => {
    const txn = await transactionsApi.create(data);
    await get().fetchTransactions();
    await get().fetchAccounts();
    return txn;
  },

  deleteTransaction: async (id) => {
    await transactionsApi.delete(id);
    await get().fetchTransactions();
    await get().fetchAccounts();
  },

  createAccount: async (data) => {
    const account = await accountsApi.create(data);
    await get().fetchAccounts();
    return account;
  },

  deleteAccount: async (id) => {
    await accountsApi.delete(id);
    await get().fetchAccounts();
  },

  createBudget: async (data) => {
    await budgetsApi.create(data);
    await get().fetchBudgets();
  },

  deleteBudget: async (id) => {
    await budgetsApi.delete(id);
    await get().fetchBudgets();
  },

  createSavingsGoal: async (data) => {
    await savingsApi.create(data);
    await get().fetchSavingsGoals();
  },

  updateSavingsGoal: async (id, data) => {
    await savingsApi.update(id, data);
    await get().fetchSavingsGoals();
  },

  deleteSavingsGoal: async (id) => {
    await savingsApi.delete(id);
    await get().fetchSavingsGoals();
  },
}));
