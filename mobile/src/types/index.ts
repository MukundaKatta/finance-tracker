// ---- Auth ----
export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  currency?: string;
}

// ---- User ----
export interface User {
  id: number;
  email: string;
  full_name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface UserUpdate {
  full_name?: string;
  currency?: string;
}

// ---- Account ----
export interface Account {
  id: number;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  institution: string | null;
  icon: string;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  account_type: string;
  balance?: number;
  currency?: string;
  institution?: string;
  icon?: string;
}

export interface AccountUpdate {
  name?: string;
  account_type?: string;
  balance?: number;
  institution?: string;
  icon?: string;
}

// ---- Category ----
export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_income: boolean;
  parent_id: number | null;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  icon?: string;
  color?: string;
  is_income?: boolean;
  parent_id?: number;
}

// ---- Transaction ----
export interface Transaction {
  id: number;
  account_id: number;
  category_id: number | null;
  amount: number;
  description: string;
  date: string;
  transaction_type: 'income' | 'expense' | 'transfer';
  notes: string | null;
  is_recurring: boolean;
  ai_category_confidence: number | null;
  created_at: string;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  account_name?: string | null;
}

export interface TransactionCreate {
  account_id: number;
  category_id?: number;
  amount: number;
  description: string;
  date: string;
  transaction_type: 'income' | 'expense' | 'transfer';
  notes?: string;
  is_recurring?: boolean;
}

export interface TransactionUpdate {
  category_id?: number;
  amount?: number;
  description?: string;
  date?: string;
  transaction_type?: string;
  notes?: string;
}

// ---- Budget ----
export interface Budget {
  id: number;
  category_id: number;
  amount: number;
  period: string;
  alert_threshold: number;
  created_at: string;
}

export interface BudgetWithSpent extends Budget {
  category_name: string;
  category_color: string;
  category_icon: string;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface BudgetCreate {
  category_id: number;
  amount: number;
  period?: string;
  alert_threshold?: number;
}

// ---- Recurring Transaction ----
export interface RecurringTransaction {
  id: number;
  account_id: number;
  category_id: number | null;
  amount: number;
  description: string;
  frequency: string;
  transaction_type: string;
  next_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

// ---- Savings Goal ----
export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  created_at: string;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  percentage: number;
  remaining: number;
  days_left: number | null;
  monthly_needed: number | null;
}

export interface SavingsGoalCreate {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  icon?: string;
  color?: string;
}

export interface SavingsGoalUpdate {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  icon?: string;
  color?: string;
}

// ---- Analytics ----
export interface SpendingSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  period_start: string;
  period_end: string;
}

export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
  percentage: number;
  transaction_count: number;
}

export interface TrendPoint {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CashFlow {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
}

export interface Insight {
  type: 'warning' | 'tip' | 'achievement' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  related_category: string | null;
}
