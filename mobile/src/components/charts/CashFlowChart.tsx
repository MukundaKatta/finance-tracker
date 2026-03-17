import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Colors, FontSize, Spacing } from '@/constants';
import type { CashFlow } from '@/types';

interface Props {
  data: CashFlow[];
}

const screenWidth = Dimensions.get('window').width;

export function CashFlowChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No cash flow data available</Text>
      </View>
    );
  }

  const labels = data.map((d) => {
    const parts = d.period.split('-');
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(parts[1])] || d.period;
  });

  return (
    <View style={styles.container}>
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data: data.map((d) => d.net),
            },
          ],
        }}
        width={screenWidth - 48}
        height={200}
        chartConfig={{
          backgroundColor: Colors.surface,
          backgroundGradientFrom: Colors.surface,
          backgroundGradientTo: Colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          labelColor: () => Colors.textMuted,
          barPercentage: 0.6,
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: Colors.surfaceLight,
            strokeWidth: 0.5,
          },
        }}
        style={styles.chart}
        withInnerLines
        showValuesOnTopOfBars={false}
        fromZero
        yAxisLabel="$"
        yAxisSuffix=""
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
