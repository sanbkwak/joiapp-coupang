// app/consent.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useI18n } from './_i18n/I18nProvider'; // adjust path if yours differs

export default function ConsentScreen() {
  const router = useRouter();
  const rootState = useRootNavigationState();
  const { t, setLocale } = useI18n();

  const [agreed, setAgreed] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko' | 'system'>('en');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      if (saved === 'ko' || saved === 'en' || saved === 'system') {
        setLanguage(saved);
      }
    })();
  }, []);

  const saveAndContinue = async () => {
    if (!agreed) {
      Alert.alert('Consent required', 'Please agree to continue.');
      return;
    }
    await AsyncStorage.setItem('privacyConsent', 'true');
    await AsyncStorage.setItem('appLanguage', language);
    await setLocale(language);

    if (!rootState?.key) return; // wait for nav to be ready
    setTimeout(() => {
      // 👇 cast to any so TS stops complaining
      router.replace('/baseline' as any);
    }, 0);
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '800' }}>Privacy & Language</Text>
        <Text style={{ color: '#374151' }}>
          We collect minimal data to provide insights. You can change this anytime in Personal Page.
        </Text>

        {/* Consent toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ fontSize: 16 }}>I agree to privacy policy</Text>
          <Switch value={agreed} onValueChange={setAgreed} />
        </View>

        {/* Language choices */}
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Language</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['system', 'en', 'ko'] as const).map((lng) => (
              <TouchableOpacity
                key={lng}
                onPress={() => setLanguage(lng)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: language === lng ? '#111827' : '#E5E7EB',
                  backgroundColor: language === lng ? '#111827' : 'white',
                }}
              >
                <Text style={{ color: language === lng ? 'white' : '#111827', fontWeight: '600' }}>
                  {lng === 'system' ? 'System' : lng === 'en' ? 'English' : '한국어'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={saveAndContinue}
        style={{ backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
