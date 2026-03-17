import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { ScreenWrapper, Card } from '@/components/common';
import { SpendingPieChart, TrendLineChart, CashFlowChart } from '@/components/charts';
import { useFinanceStore } from '@/stores/financeStore';
import { useRefresh } from '@/hooks/useRefresh';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants';
import { formatCurrency, formatPercent } from '@/utils/format';

const PERIODS = [
  { label: '1M', value: 1 },
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '1Y', value: 12 },
] as const;

export default function AnalyticsScreen() {
  const {
    summary,
    categoryBreakdown,
    trends,
    forecast,
    fetchSummary,
    fetchCategoryBreakdown,
    fetchTrends,
    fetchForecast,
  } = useFinanceStore();

  const [period, setPeriod] = useState(1);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchSummary(period),
      fetchCategoryBreakdown(period),
      fetchTrends(Math.max(period, 3)),
      fetchForecast(3),
    ]);
  }, [period]);

  useEffect(() => {
    loadData();
  }, [period]);

  const { refreshing, handleRefresh } = useRefresh(loadData);

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
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
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

        {/* Summary */}
        {summary && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryGrid}>
              <SummaryItem
                label="Income"
                value={formatCurrency(summary.total_income)}
                color={Colors.income}
              />
              <SummaryItem
                label="Expenses"
                value={formatCurrency(summary.total_expenses)}
                color={Colors.expense}
              />
              <SummaryItem
                label="Net Savings"
                value={formatCurrency(summary.net_savings)}
                color={summary.net_savings >= 0 ? Colors.income : Colors.expense}
              />
              <SummaryItem
                label="Savings Rate"
                value={formatPercent(summary.savings_rate)}
                color={summary.savings_rate >= 20 ? Colors.income : Colors.warning}
              />
            </View>
          </Card>
        )}

        {/* Spending Breakdown */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <SpendingPieChart data={categoryBreakdown} />
        </Card>

        {/* Trends */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Income vs Expenses</Text>
          <TrendLineChart data={trends} />
        </Card>

        {/* Forecast */}
        {forecast.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Forecast</Text>
            <Text style={styles.sectionSubtitle}>AI-predicted expenses</Text>
            {forecast.map((point, i) => (
              <View key={i} style={styles.forecastRow}>
                <Text style={styles.forecastDate}>{point.date}</Text>
                <View style={styles.forecastValues}>
                  <Text style={styles.forecastPredicted}>
                    {formatCurrency(point.predicted)}
                  </Text>
                  <Text style={styles.forecastRange}>
                    {formatCurrency(point.lower_bound)} -{' '}
                    {formatCurrency(point.upper_bound)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  periodChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  summaryItem: {
    width: '47%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.surfaceLight,
  },
  forecastDate: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  forecastValues: {
    alignItems: 'flex-end',
  },
  forecastPredicted: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  forecastRange: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
