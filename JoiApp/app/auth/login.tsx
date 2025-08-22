import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../screens/Login/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  return <LoginScreen onSuccess={() => router.replace('/survey')} />; // ✅ not '/tabs'
}