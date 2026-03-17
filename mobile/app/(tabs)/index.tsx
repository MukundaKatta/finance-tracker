import React, { useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl, View, Text } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/common';
import { BalanceCard, AccountsList, InsightsList, QuickActions } from '@/components/dashboard';
import { TransactionItem } from '@/components/transactions';
import { useFinanceStore } from '@/stores/financeStore';
import { useAuthStore } from '@/stores/authStore';
import { useRefresh } from '@/hooks/useRefresh';
import { Colors, FontSize, Spacing } from '@/constants';
import type { Transaction } from '@/types';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    accounts,
    summary,
    transactions,
    insights,
    loadingAnalytics,
    fetchDashboard,
  } = useFinanceStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const { refreshing, handleRefresh } = useRefresh(fetchDashboard);

  const handleTransactionPress = (txn: Transaction) => {
    router.push(`/transaction/${txn.id}`);
  };

  const actions = [
    {
      icon: 'plus-circle',
      label: 'Add',
      color: Colors.primary,
      onPress: () => router.push('/transaction/create'),
    },
    {
      icon: 'target',
      label: 'Goals',
      color: Colors.secondary,
      onPress: () => router.push('/goal/create'),
    },
    {
      icon: 'pie-chart',
      label: 'Budget',
      color: Colors.accent,
      onPress: () => router.push('/budget/create'),
    },
    {
      icon: 'bar-chart-2',
      label: 'Reports',
      color: Colors.info,
      onPress: () => router.push('/(tabs)/analytics'),
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.greeting}>
          Hello, {user?.full_name?.split(' ')[0] || 'there'}
        </Text>

        <BalanceCard summary={summary} accounts={accounts} />

        <QuickActions actions={actions} />

        {accounts.length > 0 && <AccountsList accounts={accounts} />}

        <InsightsList insights={insights} />

        {transactions.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <Text
                style={styles.seeAll}
                onPress={() => router.push('/(tabs)/transactions')}
              >
                See All
              </Text>
            </View>
            {transactions.slice(0, 5).map((txn) => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onPress={handleTransactionPress}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  recentSection: {
    marginBottom: Spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
  seeAll: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
});
