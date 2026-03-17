import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, iconMap } from '@/constants';
import { formatCurrency, formatDate, getTransactionSign } from '@/utils/format';
import type { Transaction } from '@/types';

interface Props {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, onPress }: Props) {
  const isIncome = transaction.transaction_type === 'income';
  const amountColor = isIncome ? Colors.income : Colors.expense;
  const sign = getTransactionSign(transaction.transaction_type);
  const iconName = transaction.category_icon
    ? (iconMap[transaction.category_icon] || 'tag')
    : 'tag';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress?.(transaction)}
    >
      <View
        style={[
          styles.iconBg,
          { backgroundColor: (transaction.category_color || Colors.textMuted) + '20' },
        ]}
      >
        <Feather
          name={iconName as any}
          size={18}
          color={transaction.category_color || Colors.textMuted}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.meta}>
          {transaction.category_name || 'Uncategorized'}
          {transaction.account_name ? ` \u00B7 ${transaction.account_name}` : ''}
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {sign}
          {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  pressed: {
    backgroundColor: Colors.surfaceLight + '40',
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  description: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  date: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
