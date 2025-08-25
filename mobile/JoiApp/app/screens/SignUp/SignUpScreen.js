// app/screens/SignUp/SignUpScreen.js
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// If you already have a styles file, keep this import.
// Otherwise you can remove it and rely on the inline styles below.
import styles from './SignUpScreen.styles';

const POLICY_URL = 'https://example.com/legal/privacy';
const TERMS_URL  = 'https://example.com/legal/terms';

export default function SignUpScreen({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const pwOk = useMemo(() => pw.length >= 6, [pw]);
  const pwMatch = pw && pw2 && pw === pw2;

  const canSubmit = emailOk && pwOk && pwMatch && agree && !loading;

  const handleOpen = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Oops', 'Unable to open link right now.');
    }
  };

  const handleSignUp = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);

      // TODO: replace with your real API
      await new Promise((r) => setTimeout(r, 900));

      // store token (authenticated) + consent
      await AsyncStorage.multiSet([
        ['authToken', 'demo-token'],
        ['privacyConsent', 'true'],
        // optional: mark onboarding done if you want
        // ['hasOnboarded', 'true'],
      ]);

      if (onSuccess) onSuccess();
    } catch (e) {
      Alert.alert('Sign up failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[fallback.container]}>
      <View style={fallback.card}>
        <Text style={fallback.title}>Create your account</Text>
        <Text style={fallback.sub}>Join Joi to track and improve emotional wellness.</Text>

        {/* Email */}
        <Text style={fallback.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          style={[fallback.input, !emailOk && email.length > 0 ? fallback.inputError : null]}
        />

        {/* Password */}
        <Text style={fallback.label}>Password</Text>
        <TextInput
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          placeholder="Minimum 6 characters"
          style={[fallback.input, !pwOk && pw.length > 0 ? fallback.inputError : null]}
        />

        {/* Confirm */}
        <Text style={fallback.label}>Confirm password</Text>
        <TextInput
          value={pw2}
          onChangeText={setPw2}
          secureTextEntry
          placeholder="Re-enter password"
          style={[fallback.input, pw2.length > 0 && !pwMatch ? fallback.inputError : null]}
        />

        {/* Consent row */}
        <TouchableOpacity
          onPress={() => setAgree(!agree)}
          style={fallback.agreeRow}
          activeOpacity={0.8}
        >
          <View style={[fallback.checkbox, agree && fallback.checkboxOn]}>
            {agree ? <Text style={fallback.checkboxMark}>{Platform.OS === 'ios' ? '✓' : '✔'}</Text> : null}
          </View>
          <Text style={fallback.agreeText}>
            I agree to the{' '}
            <Text style={fallback.link} onPress={() => handleOpen(TERMS_URL)}>Terms</Text>
            {' '}and{' '}
            <Text style={fallback.link} onPress={() => handleOpen(POLICY_URL)}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={!canSubmit}
          style={[fallback.primaryBtn, !canSubmit && fallback.primaryBtnDisabled]}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={fallback.primaryText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Minimal inline styles so this file works even if you don't have SignUpScreen.styles.js.
 * If you already have your own styles, you can delete `fallback` and use your import.
 */
const fallback = {
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { marginTop: 4, color: '#6B7280' },
  label: { marginTop: 14, marginBottom: 6, color: '#111827', fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputError: { borderColor: '#EF4444' },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#9CA3AF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: '#111827', borderColor: '#111827' },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  agreeText: { color: '#374151', flex: 1, flexWrap: 'wrap' },
  link: { color: '#1D4ED8', fontWeight: '600' },
  primaryBtn: { marginTop: 18, backgroundColor: '#111827', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryText: { color: '#fff', fontWeight: '800' },
};
