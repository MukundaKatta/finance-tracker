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
import { ScreenWrapper, Button, Input } from '@/components/common';
import { useFinanceStore } from '@/stores/financeStore';
import { Colors, FontSize, Spacing, BorderRadius, BUDGET_PERIODS, iconMap } from '@/constants';
import Toast from 'react-native-toast-message';

export default function CreateBudgetScreen() {
  const { categories, fetchCategories, createBudget } = useFinanceStore();
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [period, setPeriod] = useState('monthly');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const expenseCategories = categories.filter((c) => !c.is_income);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid amount' });
      return;
    }
    if (!selectedCategoryId) {
      Toast.show({ type: 'error', text1: 'Please select a category' });
      return;
    }

    setSubmitting(true);
    try {
      await createBudget({
        category_id: selectedCategoryId,
        amount: parseFloat(amount),
        period,
      });
      Toast.show({ type: 'success', text1: 'Budget created' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to create budget' });
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
          {/* Amount */}
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

          {/* Period */}
          <Text style={styles.label}>Period</Text>
          <View style={styles.periodRow}>
            {BUDGET_PERIODS.map((p) => (
              <Pressable
                key={p.value}
                style={[
                  styles.periodChip,
                  period === p.value && styles.periodChipActive,
                ]}
                onPress={() => setPeriod(p.value)}
              >
                <Text
                  style={[
                    styles.periodText,
                    period === p.value && styles.periodTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {expenseCategories.map((cat) => (
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

          <Button
            title="Create Budget"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: Spacing.xxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
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
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  periodChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  periodTextActive: {
    color: Colors.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
});
