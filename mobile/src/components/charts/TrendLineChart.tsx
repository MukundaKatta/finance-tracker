import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, FontSize, Spacing } from '@/constants';
import { formatMonth } from '@/utils/format';
import type { TrendPoint } from '@/types';

interface Props {
  data: TrendPoint[];
}

const screenWidth = Dimensions.get('window').width;

export function TrendLineChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Need at least 2 months of data for trends
        </Text>
      </View>
    );
  }

  const labels = data.map((d) => {
    const parts = d.date.split('-');
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(parts[1])] || d.date;
  });

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: data.map((d) => d.income),
              color: () => Colors.income,
              strokeWidth: 2,
            },
            {
              data: data.map((d) => d.expenses),
              color: () => Colors.expense,
              strokeWidth: 2,
            },
          ],
          legend: ['Income', 'Expenses'],
        }}
        width={screenWidth - 48}
        height={200}
        chartConfig={{
          backgroundColor: Colors.surface,
          backgroundGradientFrom: Colors.surface,
          backgroundGradientTo: Colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: () => Colors.textMuted,
          propsForDots: {
            r: '3',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: Colors.surfaceLight,
            strokeWidth: 0.5,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  chart: {
    borderRadius: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
