import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, Input } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { useFinanceStore } from '@/stores/financeStore';
import { authApi } from '@/api';
import { Colors, FontSize, Spacing, BorderRadius, CURRENCIES } from '@/constants';
import { formatCurrency } from '@/utils/format';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { accounts, recurring, fetchAccounts, fetchRecurring } = useFinanceStore();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchRecurring();
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const activeRecurring = recurring.filter((r) => r.is_active).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateMe({ full_name: fullName, currency });
      await useAuthStore.getState().loadUser();
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{accounts.length}</Text>
            <Text style={styles.statLabel}>Accounts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {formatCurrency(totalBalance)}
            </Text>
            <Text style={styles.statLabel}>Net Worth</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{activeRecurring}</Text>
            <Text style={styles.statLabel}>Recurring</Text>
          </View>
        </View>

        {/* Edit Profile */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Settings</Text>
            <Pressable onPress={() => setEditing(!editing)}>
              <Feather
                name={editing ? 'x' : 'edit-2'}
                size={18}
                color={Colors.primary}
              />
            </Pressable>
          </View>

          {editing ? (
            <View>
              <Input
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                leftIcon="user"
              />
              <Text style={styles.inputLabel}>Currency</Text>
              <View style={styles.currencyRow}>
                {CURRENCIES.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.currencyChip,
                      currency === c && styles.currencyChipActive,
                    ]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        currency === c && styles.currencyTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: Spacing.lg }}
              />
            </View>
          ) : (
            <View>
              <ProfileRow icon="user" label="Name" value={user?.full_name || ''} />
              <ProfileRow icon="mail" label="Email" value={user?.email || ''} />
              <ProfileRow icon="dollar-sign" label="Currency" value={user?.currency || 'USD'} />
              <ProfileRow
                icon="calendar"
                label="Member since"
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : ''
                }
              />
            </View>
          )}
        </Card>

        {/* Menu Items */}
        <Card style={styles.section}>
          <MenuItem icon="repeat" label="Recurring Transactions" count={activeRecurring} />
          <MenuItem icon="bell" label="Notifications" />
          <MenuItem icon="shield" label="Security" />
          <MenuItem icon="help-circle" label="Help & Support" />
        </Card>

        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          style={{ marginTop: Spacing.lg }}
        />

        <View style={styles.version}>
          <Text style={styles.versionText}>Finance Tracker v1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.profileRow}>
      <Feather name={icon as any} size={16} color={Colors.textMuted} />
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue}>{value}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  count,
}: {
  icon: string;
  label: string;
  count?: number;
}) {
  return (
    <Pressable style={styles.menuItem}>
      <Feather name={icon as any} size={18} color={Colors.textSecondary} />
      <Text style={styles.menuLabel}>{label}</Text>
      {count !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  email: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.surfaceLight,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  currencyChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
  },
  currencyChipActive: {
    backgroundColor: Colors.primary,
  },
  currencyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  currencyTextActive: {
    color: Colors.white,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.surfaceLight,
  },
  profileRowLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginLeft: Spacing.md,
    flex: 1,
  },
  profileRowValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.surfaceLight,
  },
  menuLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    marginLeft: Spacing.md,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: Spacing.sm,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  version: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
