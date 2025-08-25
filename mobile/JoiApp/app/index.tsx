// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';

type Boot = {
  loading: boolean;
  onboarded: boolean;
  token: string | null;
  baselineDone: boolean;
};

export default function Index() {
  const [boot, setBoot] = useState<Boot>({
    loading: true,
    onboarded: false,
    token: null,
    baselineDone: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const [onboarded, token, baseline] = await Promise.all([
          AsyncStorage.getItem('hasOnboarded'),
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('baselineDone'),
        ]);

        setBoot({
          loading: false,
          onboarded: onboarded === 'true',
          token: token ?? null,
          baselineDone: baseline === 'true',
        });
      } catch {
        setBoot({
          loading: false,
          onboarded: false,
          token: null,
          baselineDone: false,
        });
      }
    })();
  }, []);

  if (boot.loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // No consent gate here anymore 👇
  if (!boot.onboarded) return <Redirect href="/landing" />;
  if (!boot.token) return <Redirect href="/auth/login" />;
  if (!boot.baselineDone) return <Redirect href="/(tabs)/survey" />;

  // All set → Home (Dashboard) tab
  return <Redirect href="/(tabs)/dashboard" />;
}
