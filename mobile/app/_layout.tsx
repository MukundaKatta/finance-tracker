import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/stores/authStore';
import { LoadingScreen } from '@/components/common';
import { Colors } from '@/constants';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/[id]"
          options={{ title: 'Transaction Details' }}
        />
        <Stack.Screen
          name="transaction/create"
          options={{ title: 'Add Transaction', presentation: 'modal' }}
        />
        <Stack.Screen
          name="budget/create"
          options={{ title: 'Create Budget', presentation: 'modal' }}
        />
        <Stack.Screen
          name="goal/[id]"
          options={{ title: 'Savings Goal' }}
        />
        <Stack.Screen
          name="goal/create"
          options={{ title: 'New Goal', presentation: 'modal' }}
        />
      </Stack>
      <Toast />
    </>
  );
}
