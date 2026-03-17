import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toFixed(2);
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE');
  return format(date, 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatMonth(dateStr: string): string {
  // Handle "YYYY-MM" format
  if (dateStr.length <= 7) {
    const [year, month] = dateStr.split('-');
    return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yyyy');
  }
  return format(parseISO(dateStr), 'MMM yyyy');
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getTransactionSign(type: string): string {
  switch (type) {
    case 'income':
      return '+';
    case 'expense':
      return '-';
    default:
      return '';
  }
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case 'income':
      return '#10B981';
    case 'expense':
      return '#EF4444';
    default:
      return '#3B82F6';
  }
}
