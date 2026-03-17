import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper, Button, Input } from '@/components/common';
import { useFinanceStore } from '@/stores/financeStore';
import { Colors, FontSize, Spacing, BorderRadius, CATEGORY_COLORS } from '@/constants';
import Toast from 'react-native-toast-message';

const GOAL_ICONS = [
  { icon: 'target', label: 'Target' },
  { icon: 'shield', label: 'Emergency' },
  { icon: 'navigation', label: 'Travel' },
  { icon: 'monitor', label: 'Tech' },
  { icon: 'home', label: 'Home' },
  { icon: 'truck', label: 'Car' },
  { icon: 'book', label: 'Education' },
  { icon: 'gift', label: 'Gift' },
];

export default function CreateGoalScreen() {
  const { createSavingsGoal } = useFinanceStore();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a goal name' });
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a target amount' });
      return;
    }

    setSubmitting(true);
    try {
      await createSavingsGoal({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: currentAmount ? parseFloat(currentAmount) : 0,
        target_date: targetDate || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });
      Toast.show({ type: 'success', text1: 'Goal created!' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to create goal' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Goal Name"
            placeholder="e.g., Emergency Fund"
            value={name}
            onChangeText={setName}
            leftIcon="flag"
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Target Amount"
                placeholder="10000"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
                leftIcon="dollar-sign"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Already Saved"
                placeholder="0"
                value={currentAmount}
                onChangeText={setCurrentAmount}
                keyboardType="decimal-pad"
                leftIcon="dollar-sign"
              />
            </View>
          </View>

          <Input
            label="Target Date (optional)"
            placeholder="YYYY-MM-DD"
            value={targetDate}
            onChangeText={setTargetDate}
            leftIcon="calendar"
          />

          {/* Icon Selection */}
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map(({ icon, label }) => (
              <Pressable
                key={icon}
                style={[
                  styles.iconChip,
                  selectedIcon === icon && {
                    backgroundColor: selectedColor + '20',
                    borderColor: selectedColor,
                  },
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Feather
                  name={icon as any}
                  size={20}
                  color={selectedIcon === icon ? selectedColor : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.iconLabel,
                    selectedIcon === icon && { color: selectedColor },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Color Selection */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {CATEGORY_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorDotSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <Button
            title="Create Goal"
            variant="secondary"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: Spacing.xxl }}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  iconChip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    minWidth: 72,
  },
  iconLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
