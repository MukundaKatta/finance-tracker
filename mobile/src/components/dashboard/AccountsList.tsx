import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/common';
import { Colors, FontSize, Spacing, iconMap } from '@/constants';
import { formatCurrency } from '@/utils/format';
import type { Account } from '@/types';

interface Props {
  accounts: Account[];
  onPressAccount?: (account: Account) => void;
}

export function AccountsList({ accounts, onPressAccount }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Accounts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {accounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => onPressAccount?.(account)}
          >
            <Card style={styles.accountCard}>
              <View style={styles.iconContainer}>
                <Feather
                  name={(iconMap[account.icon] || 'credit-card') as any}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {account.name}
              </Text>
              <Text style={styles.type}>{account.account_type}</Text>
              <Text
                style={[
                  styles.balance,
                  account.balance < 0 && styles.negative,
                ]}
              >
                {formatCurrency(account.balance)}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
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
  accountCard: {
    width: 160,
    marginRight: Spacing.md,
    padding: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  type: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
    marginBottom: Spacing.sm,
  },
  balance: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  negative: {
    color: Colors.expense,
  },
});
