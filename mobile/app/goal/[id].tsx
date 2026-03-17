import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, Input, LoadingScreen } from '@/components/common';
import { useFinanceStore } from '@/stores/financeStore';
import { Colors, FontSize, Spacing, BorderRadius, iconMap } from '@/constants';
import { formatCurrency, formatPercent } from '@/utils/format';
import Toast from 'react-native-toast-message';
import type { SavingsGoalWithProgress } from '@/types';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savingsGoals, fetchSavingsGoals, updateSavingsGoal, deleteSavingsGoal } =
    useFinanceStore();
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSavingsGoals().finally(() => setLoading(false));
  }, []);

  const goal = savingsGoals.find((g) => g.id === Number(id));

  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0 || !goal) return;

    setSaving(true);
    try {
      const newAmount = goal.current_amount + parseFloat(addAmount);
      await updateSavingsGoal(goal.id, {
        current_amount: Math.min(newAmount, goal.target_amount * 2),
      });
      setAddAmount('');
      Toast.show({ type: 'success', text1: 'Funds added!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavingsGoal(Number(id));
            Toast.show({ type: 'success', text1: 'Goal deleted' });
            router.back();
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to delete' });
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!goal) {
    return (
      <ScreenWrapper>
        <Text style={styles.notFound}>Goal not found</Text>
      </ScreenWrapper>
    );
  }

  const pct = Math.min(goal.percentage, 100);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Goal Header */}
        <View style={styles.header}>
          <View style={[styles.iconBg, { backgroundColor: goal.color + '20' }]}>
            <Feather
              name={(iconMap[goal.icon] || 'target') as any}
              size={32}
              color={goal.color}
            />
          </View>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={[styles.percentage, { color: goal.color }]}>
            {formatPercent(goal.percentage)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBar,
                { width: `${pct}%`, backgroundColor: goal.color },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressStart}>
              {formatCurrency(goal.current_amount)}
            </Text>
            <Text style={styles.progressEnd}>
              {formatCurrency(goal.target_amount)}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatItem
              label="Remaining"
              value={formatCurrency(goal.remaining)}
              color={Colors.warning}
            />
            <StatItem
              label="Saved"
              value={formatCurrency(goal.current_amount)}
              color={Colors.income}
            />
            {goal.days_left !== null && (
              <StatItem
                label="Days Left"
                value={String(goal.days_left)}
                color={Colors.info}
              />
            )}
            {goal.monthly_needed !== null && (
              <StatItem
                label="Monthly Needed"
                value={formatCurrency(goal.monthly_needed)}
                color={Colors.primary}
              />
            )}
          </View>
        </Card>

        {/* Add Funds */}
        <Card style={styles.addFundsCard}>
          <Text style={styles.addFundsTitle}>Add Funds</Text>
          <View style={styles.addFundsRow}>
            <Input
              placeholder="Amount"
              value={addAmount}
              onChangeText={setAddAmount}
              keyboardType="decimal-pad"
              style={styles.addFundsInput}
            />
            <Button
              title="Add"
              onPress={handleAddFunds}
              loading={saving}
              fullWidth={false}
              style={styles.addButton}
            />
          </View>
        </Card>

        <Button
          title="Delete Goal"
          variant="danger"
          onPress={handleDelete}
          style={{ marginTop: Spacing.xl }}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  goalName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  percentage: {
    fontSize: FontSize.display,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  progressSection: {
    marginBottom: Spacing.xl,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  progressStart: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  progressEnd: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    width: '47%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  addFundsCard: {},
  addFundsTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  addFundsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  addFundsInput: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: Spacing.xxl,
    marginTop: 0,
  },
  notFound: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
