import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/common';
import { Colors, FontSize, Spacing } from '@/constants';
import { formatCurrency } from '@/utils/format';
import type { SpendingSummary, Account } from '@/types';

interface Props {
  summary: SpendingSummary | null;
  accounts: Account[];
}

export function BalanceCard({ summary, accounts }: Props) {
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.balance}>{formatCurrency(totalBalance)}</Text>

      {summary && (
        <View style={styles.row}>
          <View style={styles.stat}>
            <View style={styles.iconRow}>
              <Feather name="arrow-up-circle" size={14} color={Colors.income} />
              <Text style={styles.statLabel}> Income</Text>
            </View>
            <Text style={[styles.statValue, { color: Colors.income }]}>
              {formatCurrency(summary.total_income)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <View style={styles.iconRow}>
              <Feather
                name="arrow-down-circle"
                size={14}
                color={Colors.expense}
              />
              <Text style={styles.statLabel}> Expenses</Text>
            </View>
            <Text style={[styles.statValue, { color: Colors.expense }]}>
              {formatCurrency(summary.total_expenses)}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  balance: {
    color: Colors.white,
    fontSize: FontSize.display,
    fontWeight: '700',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    padding: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.md,
  },
});
