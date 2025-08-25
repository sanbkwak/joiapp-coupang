// app/baseline.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useRootNavigationState } from 'expo-router';

export default function BaselineSurvey() {
  const router = useRouter();
  const rootState = useRootNavigationState();
  const [q, setQ] = useState(0); // 0..19 (20 questions total)

  const goDashboard = async () => {
    await AsyncStorage.setItem('baselineDone', 'true');

    // ensure the nav tree is mounted before replacing
    if (!rootState?.key) return;
    // defer one tick to avoid action-not-handled on first mount
    setTimeout(() => {
      router.replace('/(tabs)/dashboard' as any);
    }, 0);
  };

  const next = async () => {
    if (q < 19) setQ((p) => p + 1);
    else await goDashboard();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '800' }}>Baseline Survey</Text>
      <Text style={{ color: '#374151' }}>Question {q + 1} of 20</Text>

      {/* TODO: render your real question UI here */}
      <View
        style={{
          height: 200,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Question UI placeholder</Text>
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
          {q < 19 ? 'Next' : 'Finish'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
