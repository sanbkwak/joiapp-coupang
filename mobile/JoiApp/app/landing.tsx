// app/landing.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Landing() {
  const router = useRouter();

  const startOnboarding = async () => {
    // ensure flags allow onboarding to run
    await AsyncStorage.multiRemove(['hasOnboarded', 'privacyConsent', 'baselineDone']);
    router.replace('/onboarding' as any);
  };

  const goLogin = () => router.replace('/auth/login' as any);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / icon bubble */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🤍</Text>
        </View>

        {/* Headline + sub */}
        <Text style={styles.title}>Joi App</Text>
        <Text style={styles.subtitle}>
          AI-driven emotional wellness with Metaverse action
        </Text>

        {/* Feature blips */}
        <View style={styles.features}>
          <Feature tag="Multimodal tracking" />
          <Feature tag="AI insights" />
          <Feature tag="Personalized actions" />
        </View>

        {/* CTAs */}
        <TouchableOpacity style={styles.primaryBtn} onPress={startOnboarding}>
          <Text style={styles.primaryText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={goLogin}>
          <Text style={styles.secondaryText}>I already have an account</Text>
        </TouchableOpacity>

        {/* Footer space */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ tag }: { tag: string }) {
  return (
    <View style={styles.chip}>
      <View style={styles.dot} />
      <Text style={styles.chipText}>{tag}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  // centers everything vertically & horizontally on most phones
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoCircle: {
    width: 108,
    height: 108,
    borderRadius: 999,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoEmoji: { fontSize: 34, color: 'white' },

  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 340,
  },

  features: {
    marginTop: 20,
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    maxWidth: 420,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#6366F1',
  },
  chipText: { color: '#111827', fontWeight: '600' },

  primaryBtn: {
    marginTop: 26,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  primaryText: { color: 'white', fontWeight: '800', fontSize: 18 },

  secondaryBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  secondaryText: { color: '#111827', fontWeight: '700' },
});
