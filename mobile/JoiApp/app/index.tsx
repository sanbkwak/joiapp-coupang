// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';

export default function Index() {
  const [boot, setBoot] = useState<{ onboarded: boolean | null; token: string | null }>({
    onboarded: null,
    token: null,
  });

  useEffect(() => {
    (async () => {
      const [hasOnboarded, token] = await Promise.all([
        AsyncStorage.getItem('hasOnboarded'),
        AsyncStorage.getItem('authToken'),
      ]);
      setBoot({ onboarded: hasOnboarded === 'true', token });
    })();
  }, []);

  if (boot.onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!boot.onboarded) return <Redirect href="/onboarding" />;
  if (!boot.token) return <Redirect href="/auth/login" />;
  return <Redirect href="/survey" />;
}
