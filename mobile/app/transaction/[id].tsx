import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, LoadingScreen } from '@/components/common';
import { transactionsApi } from '@/api';
import { useFinanceStore } from '@/stores/financeStore';
import { Colors, FontSize, Spacing, BorderRadius, iconMap } from '@/constants';
import { formatCurrency, formatDate, getTransactionColor } from '@/utils/format';
import Toast from 'react-native-toast-message';
import type { Transaction } from '@/types';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const { deleteTransaction } = useFinanceStore();

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const txn = await transactionsApi.get(Number(id));
      setTransaction(txn);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load transaction' });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure? This will also update your account balance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(Number(id));
              Toast.show({ type: 'success', text1: 'Transaction deleted' });
              router.back();
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to delete' });
            }
          },
        },
      ],
    );
  };

  if (loading) return <LoadingScreen />;
  if (!transaction) return null;

  const isIncome = transaction.transaction_type === 'income';
  const color = getTransactionColor(transaction.transaction_type);
  const categoryIcon = transaction.category_icon
    ? (iconMap[transaction.category_icon] || 'tag')
    : 'tag';

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Amount Header */}
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.typeText, { color }]}>
              {transaction.transaction_type.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.amount, { color }]}>
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <DetailRow
            icon={categoryIcon}
            label="Category"
            value={transaction.category_name || 'Uncategorized'}
            valueColor={transaction.category_color || undefined}
          />
          <DetailRow
            icon="credit-card"
            label="Account"
            value={transaction.account_name || `Account #${transaction.account_id}`}
          />
          <DetailRow
            icon="calendar"
            label="Date"
            value={formatDate(transaction.date)}
          />
          {transaction.is_recurring && (
            <DetailRow icon="repeat" label="Recurring" value="Yes" />
          )}
          {transaction.ai_category_confidence !== null && (
            <DetailRow
              icon="cpu"
              label="AI Confidence"
              value={`${(transaction.ai_category_confidence * 100).toFixed(1)}%`}
            />
          )}
          {transaction.notes && (
            <DetailRow icon="file-text" label="Notes" value={transaction.notes} />
          )}
        </Card>

        <Button
          title="Delete Transaction"
          variant="danger"
          onPress={handleDelete}
          style={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Feather
          name={icon as any}
          size={16}
          color={Colors.textMuted}
        />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  amount: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  description: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '500',
  },
  date: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  detailsCard: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.surfaceLight,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginLeft: Spacing.md,
  },
  detailValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
    maxWidth: '50%',
    textAlign: 'right',
  },
});
