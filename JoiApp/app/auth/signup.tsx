// app/auth/signup.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import SignUpScreen from '../screens/SignUp/SignUpScreen';

export default function SignUpRoute() {
  const router = useRouter();
  return (
    <SignUpScreen onSuccess={() => router.replace('/(tabs)/survey')} />
  );
}
