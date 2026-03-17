import React from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from '@/components/common';
import { Colors, FontSize, Spacing } from '@/constants';
import type { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
  onPressTransaction?: (transaction: Transaction) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
}

interface Section {
  title: string;
  data: Transaction[];
}

function groupByDate(transactions: Transaction[]): Section[] {
  const groups: Record<string, Transaction[]> = {};
  for (const txn of transactions) {
    const key = txn.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(txn);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateStr, data]) => {
      let title: string;
      try {
        title = format(parseISO(dateStr), 'EEEE, MMM d');
      } catch {
        title = dateStr;
      }
      return { title, data };
    });
}

export function TransactionList({
  transactions,
  onPressTransaction,
  refreshing,
  onRefresh,
  ListHeaderComponent,
}: Props) {
  const sections = groupByDate(transactions);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <TransactionItem
          transaction={item}
          onPress={onPressTransaction}
        />
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="inbox"
          title="No transactions"
          message="Your transactions will appear here once you add them."
        />
      }
      ListHeaderComponent={ListHeaderComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={transactions.length === 0 ? styles.empty : undefined}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  empty: {
    flexGrow: 1,
  },
});
