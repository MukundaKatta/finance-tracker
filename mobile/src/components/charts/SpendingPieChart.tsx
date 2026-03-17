import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, iconMap } from '@/constants';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { CategoryBreakdown } from '@/types';

interface Props {
  data: CategoryBreakdown[];
}

const screenWidth = Dimensions.get('window').width;

export function SpendingPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Feather name="pie-chart" size={32} color={Colors.textMuted} />
        <Text style={styles.emptyText}>No spending data yet</Text>
      </View>
    );
  }

  const chartData = data.slice(0, 6).map((item) => ({
    name: item.category_name,
    amount: item.total,
    color: item.category_color,
    legendFontColor: Colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={180}
        chartConfig={{
          color: () => Colors.text,
          labelColor: () => Colors.textSecondary,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
      />

      <View style={styles.legend}>
        {data.slice(0, 8).map((item) => (
          <View key={item.category_id} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View
                style={[styles.dot, { backgroundColor: item.category_color }]}
              />
              <View style={styles.legendIconContainer}>
                <Feather
                  name={(iconMap[item.category_icon] || 'tag') as any}
                  size={12}
                  color={item.category_color}
                />
              </View>
              <Text style={styles.legendLabel} numberOfLines={1}>
                {item.category_name}
              </Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendAmount}>
                {formatCurrency(item.total)}
              </Text>
              <Text style={styles.legendPct}>
                {formatPercent(item.percentage)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
  legend: {
    marginTop: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  legendIconContainer: {
    marginRight: Spacing.xs,
  },
  legendLabel: {
    color: Colors.text,
    fontSize: FontSize.sm,
    flex: 1,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendAmount: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  legendPct: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    minWidth: 40,
    textAlign: 'right',
  },
});
