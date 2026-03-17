import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/common';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants';
import type { Insight } from '@/types';

interface Props {
  insights: Insight[];
}

const insightIcon: Record<string, string> = {
  warning: 'alert-triangle',
  tip: 'info',
  achievement: 'award',
  info: 'info',
};

const insightColor: Record<string, string> = {
  warning: Colors.warning,
  tip: Colors.info,
  achievement: Colors.success,
  info: Colors.info,
};

export function InsightsList({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AI Insights</Text>
      {insights.slice(0, 5).map((insight, index) => (
        <Card key={index} style={styles.insightCard}>
          <View style={styles.row}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: insightColor[insight.type] + '20' },
              ]}
            >
              <Feather
                name={(insightIcon[insight.type] || 'info') as any}
                size={16}
                color={insightColor[insight.type] || Colors.info}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{insight.title}</Text>
              <Text style={styles.message}>{insight.message}</Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  insightCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});
