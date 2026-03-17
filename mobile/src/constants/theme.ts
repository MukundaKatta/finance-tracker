export const Colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#10B981',
  secondaryLight: '#34D399',
  accent: '#F59E0B',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  surfaceHighlight: '#475569',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  income: '#10B981',
  expense: '#EF4444',
  transfer: '#3B82F6',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  cardGradientStart: '#1E293B',
  cardGradientEnd: '#0F172A',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 34,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const iconMap: Record<string, string> = {
  wallet: 'wallet',
  building: 'home',
  'piggy-bank': 'save',
  'credit-card': 'credit-card',
  'trending-up': 'trending-up',
  cart: 'shopping-cart',
  utensils: 'coffee',
  car: 'truck',
  fuel: 'droplet',
  zap: 'zap',
  home: 'home',
  shield: 'shield',
  heart: 'heart',
  film: 'film',
  'shopping-bag': 'shopping-bag',
  repeat: 'repeat',
  book: 'book',
  plane: 'navigation',
  scissors: 'scissors',
  gift: 'gift',
  wrench: 'tool',
  'paw-print': 'github',
  briefcase: 'briefcase',
  laptop: 'monitor',
  tag: 'tag',
  target: 'target',
};
