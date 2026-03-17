import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper, Button, Input, Card } from '@/components/common';
import { useFinanceStore } from '@/stores/financeStore';
import { Colors, FontSize, Spacing, BorderRadius, iconMap, TRANSACTION_TYPES } from '@/constants';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

export default function CreateTransactionScreen() {
  const {
    accounts,
    categories,
    fetchAccounts,
    fetchCategories,
    createTransaction,
  } = useFinanceStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<string>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === null) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const filteredCategories = categories.filter((c) =>
    transactionType === 'income' ? c.is_income : !c.is_income,
  );

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid amount' });
      return;
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a description' });
      return;
    }
    if (!selectedAccountId) {
      Toast.show({ type: 'error', text1: 'Please select an account' });
      return;
    }

    setSubmitting(true);
    try {
      await createTransaction({
        account_id: selectedAccountId,
        category_id: selectedCategoryId || undefined,
        amount: parseFloat(amount),
        description: description.trim(),
        date: format(new Date(), 'yyyy-MM-dd'),
        transaction_type: transactionType as any,
        notes: notes.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'Transaction added' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to create transaction' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Transaction Type */}
          <View style={styles.typeRow}>
            {TRANSACTION_TYPES.map((t) => (
              <Pressable
                key={t.value}
                style={[
                  styles.typeChip,
                  transactionType === t.value && {
                    backgroundColor: t.color + '20',
                    borderColor: t.color,
                  },
                ]}
                onPress={() => {
                  setTransactionType(t.value);
                  setSelectedCategoryId(null);
                }}
              >
                <Text
                  style={[
                    styles.typeText,
                    transactionType === t.value && { color: t.color },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySign}>$</Text>
            <Input
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>

          <Input
            label="Description"
            placeholder="What was this for?"
            value={description}
            onChangeText={setDescription}
            leftIcon="edit-3"
          />

          {/* Account Selection */}
          <Text style={styles.label}>Account</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                style={[
                  styles.selectChip,
                  selectedAccountId === account.id && styles.selectChipActive,
                ]}
                onPress={() => setSelectedAccountId(account.id)}
              >
                <Feather
                  name={(iconMap[account.icon] || 'credit-card') as any}
                  size={14}
                  color={
                    selectedAccountId === account.id
                      ? Colors.white
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.selectChipText,
                    selectedAccountId === account.id &&
                      styles.selectChipTextActive,
                  ]}
                >
                  {account.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Category Selection */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === cat.id && {
                    backgroundColor: cat.color + '20',
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Feather
                  name={(iconMap[cat.icon] || 'tag') as any}
                  size={14}
                  color={
                    selectedCategoryId === cat.id
                      ? cat.color
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategoryId === cat.id && { color: cat.color },
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Notes (optional)"
            placeholder="Add any extra details"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            leftIcon="file-text"
          />

          <Button
            title="Add Transaction"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: Spacing.md }}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  typeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  currencySign: {
    color: Colors.textMuted,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  amountInput: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  chipScroll: {
    marginBottom: Spacing.md,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  selectChipActive: {
    backgroundColor: Colors.primary,
  },
  selectChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  selectChipTextActive: {
    color: Colors.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    gap: Spacing.xs,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  bottomSpacer: {
    height: Spacing.xxxl * 2,
  },
});
