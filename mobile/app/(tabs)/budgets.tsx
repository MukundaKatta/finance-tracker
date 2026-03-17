import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper, Card, EmptyState } from '@/components/common';
import { BudgetCard } from '@/components/budgets';
import { useFinanceStore } from '@/stores/financeStore';
import { useRefresh } from '@/hooks/useRefresh';
import { Colors, FontSize, Spacing } from '@/constants';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { SavingsGoalWithProgress } from '@/types';

export default function BudgetsScreen() {
  const {
    budgets,
    savingsGoals,
    loadingBudgets,
    loadingGoals,
    fetchBudgets,
    fetchSavingsGoals,
  } = useFinanceStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchBudgets(), fetchSavingsGoals()]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const { refreshing, handleRefresh } = useRefresh(loadData);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Monthly Budget</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
          </Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.min(overallPct, 100)}%`,
                  backgroundColor:
                    overallPct > 100 ? Colors.error : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.pctText}>{formatPercent(overallPct)} used</Text>
        </Card>

        {/* Budgets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category Budgets</Text>
          <Pressable onPress={() => router.push('/budget/create')}>
            <Feather name="plus-circle" size={22} color={Colors.primary} />
          </Pressable>
        </View>

        {budgets.length === 0 ? (
          <EmptyState
            icon="pie-chart"
            title="No budgets yet"
            message="Create budgets to track spending by category."
          />
        ) : (
          budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))
        )}

        {/* Savings Goals */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <Pressable onPress={() => router.push('/goal/create')}>
            <Feather name="plus-circle" size={22} color={Colors.secondary} />
          </Pressable>
        </View>

        {savingsGoals.length === 0 ? (
          <EmptyState
            icon="target"
            title="No savings goals"
            message="Set goals and track your progress."
          />
        ) : (
          savingsGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onPress={() => router.push(`/goal/${goal.id}`)}
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function GoalCard({
  goal,
  onPress,
}: {
  goal: SavingsGoalWithProgress;
  onPress: () => void;
}) {
  const pct = Math.min(goal.percentage, 100);

  return (
    <Card style={styles.goalCard} onPress={onPress}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text style={[styles.goalPct, { color: goal.color }]}>
          {formatPercent(goal.percentage)}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.bar,
            { width: `${pct}%`, backgroundColor: goal.color },
          ]}
        />
      </View>
      <View style={styles.goalFooter}>
        <Text style={styles.goalAmount}>
          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
        </Text>
        {goal.days_left !== null && (
          <Text style={styles.goalDays}>{goal.days_left} days left</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  summaryAmount: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginVertical: Spacing.sm,
  },
  barBg: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  pctText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
  goalCard: {
    marginBottom: Spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  goalPct: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  goalAmount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  goalDays: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
