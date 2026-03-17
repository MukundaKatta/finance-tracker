import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/common';
import { TransactionList } from '@/components/transactions';
import { useFinanceStore } from '@/stores/financeStore';
import { useRefresh } from '@/hooks/useRefresh';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants';
import type { Transaction } from '@/types';

const FILTERS = ['All', 'Expense', 'Income', 'Transfer'] as const;

export default function TransactionsScreen() {
  const { transactions, loadingTransactions, fetchTransactions } = useFinanceStore();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  useEffect(() => {
    fetchTransactions({ limit: 100 });
  }, []);

  const loadFiltered = useCallback(async () => {
    const filters: Record<string, any> = { limit: 100 };
    if (activeFilter !== 'All') {
      filters.transaction_type = activeFilter.toLowerCase();
    }
    await fetchTransactions(filters);
  }, [activeFilter]);

  useEffect(() => {
    loadFiltered();
  }, [activeFilter]);

  const { refreshing, handleRefresh } = useRefresh(loadFiltered);

  const handlePress = (txn: Transaction) => {
    router.push(`/transaction/${txn.id}`);
  };

  const FilterBar = (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        style={styles.addButton}
        onPress={() => router.push('/transaction/create')}
      >
        <Feather name="plus" size={22} color={Colors.white} />
      </Pressable>
    </View>
  );

  return (
    <ScreenWrapper padded={false}>
      <TransactionList
        transactions={transactions}
        onPressTransaction={handlePress}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={FilterBar}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.white,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
});
