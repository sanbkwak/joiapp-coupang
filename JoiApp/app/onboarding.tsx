// app/onboarding.tsx
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import OnboardingScreen from './screens/Onboarding/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();

  const handleFinish = async () => {
    try { await AsyncStorage.setItem('hasOnboarded', 'true'); } catch {}
    router.replace('/auth/login');
  };

  return <OnboardingScreen onFinish={handleFinish} />;
}
