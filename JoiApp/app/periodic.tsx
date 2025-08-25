// app/periodic.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useRootNavigationState } from 'expo-router';

export default function PeriodicSurvey() {
  const router = useRouter();
  const rootState = useRootNavigationState();
  const [q, setQ] = useState(0); // 0..3 (4 questions)

  const finishSurvey = async () => {
    await AsyncStorage.setItem('lastPeriodicAt', new Date().toISOString());

    if (!rootState?.key) return; // wait for nav tree to be ready
    setTimeout(() => {
      router.replace('/(tabs)/dashboard' as any); // 👈 correct path with group + cast
    }, 0);
  };

  const next = async () => {
    if (q < 3) setQ((p) => p + 1);
    else await finishSurvey();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '800' }}>Quick Check-in</Text>
      <Text style={{ color: '#374151' }}>Question {q + 1} of 4</Text>

      {/* TODO: real Q UI */}
      <View
        style={{
          height: 180,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Periodic question placeholder</Text>
      </View>

      <TouchableOpacity
        onPress={next}
        style={{
          backgroundColor: '#111827',
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>
          {q < 3 ? 'Next' : 'Finish'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
