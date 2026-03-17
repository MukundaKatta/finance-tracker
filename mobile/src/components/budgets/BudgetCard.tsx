import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/common';
import { Colors, FontSize, Spacing, BorderRadius, iconMap } from '@/constants';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { BudgetWithSpent } from '@/types';

interface Props {
  budget: BudgetWithSpent;
  onPress?: (budget: BudgetWithSpent) => void;
}

export function BudgetCard({ budget, onPress }: Props) {
  const pct = Math.min(budget.percentage, 100);
  const isOver = budget.percentage > 100;
  const isWarning = budget.percentage >= budget.alert_threshold * 100;
  const barColor = isOver
    ? Colors.error
    : isWarning
      ? Colors.warning
      : Colors.primary;

  return (
    <Card
      style={styles.card}
      onPress={() => onPress?.(budget)}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBg,
              { backgroundColor: budget.category_color + '20' },
            ]}
          >
            <Feather
              name={(iconMap[budget.category_icon] || 'tag') as any}
              size={16}
              color={budget.category_color}
            />
          </View>
          <View>
            <Text style={styles.name}>{budget.category_name}</Text>
            <Text style={styles.period}>{budget.period}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.percentage, { color: barColor }]}>
            {formatPercent(budget.percentage)}
          </Text>
        </View>
      </View>

      <View style={styles.barBg}>
        <View
          style={[
            styles.bar,
            { width: `${pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.spent}>
          {formatCurrency(budget.spent)} spent
        </Text>
        <Text style={styles.remaining}>
          {formatCurrency(budget.remaining)} left of {formatCurrency(budget.amount)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  period: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spent: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  remaining: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
