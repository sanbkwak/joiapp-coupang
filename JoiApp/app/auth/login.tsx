// app/auth/login.tsx
import React from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import LoginScreen from '../screens/Login/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const rootState = useRootNavigationState();

  return (
    <LoginScreen
      onSuccess={() => {
        if (!rootState?.key) return; // wait for nav tree
        setTimeout(() => {
          router.replace('/(tabs)/dashboard' as any); // 👈 cast quiets typing
        }, 0);
      }}
    />
  );
}
