import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants';

interface ActionItem {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

interface Props {
  actions: ActionItem[];
}

export function QuickActions({ actions }: Props) {
  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <Pressable
          key={index}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          onPress={action.onPress}
        >
          <View style={[styles.iconBg, { backgroundColor: action.color + '20' }]}>
            <Feather name={action.icon as any} size={22} color={action.color} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  action: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
