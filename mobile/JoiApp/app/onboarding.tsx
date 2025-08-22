// app/onboarding.tsx
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import OnboardingScreen from './screens/Onboarding/OnboardingScreen';

// Tell TS what props the JS screen accepts
type OnboardingScreenProps = {
  onFinish?: () => void;
};

// Cast the JS component to a typed React component
const Onboarding = OnboardingScreen as React.ComponentType<OnboardingScreenProps>;

export default function OnboardingRoute() {
  const router = useRouter();

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
    } catch {}
    router.replace('/auth/login');
  };

  return <Onboarding onFinish={handleFinish} />;
}
