// app/screens/SignUp/SignUpScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import styles from './SignUpScreen.styles';

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function SignUpScreen({ onSuccess }) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const next = { email: '', password: '', confirm: '' };

    if (!email) next.email = 'Email is required';
    else if (!isEmail(email)) next.email = 'Please enter a valid email address';

    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      next.password = 'Include uppercase, lowercase, and a number';

    if (!confirm) next.confirm = 'Please confirm your password';
    else if (confirm !== password) next.confirm = 'Passwords do not match';

    setErrors(next);
    return !next.email && !next.password && !next.confirm;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      // TODO: replace with real API request
      await new Promise((r) => setTimeout(r, 1400));

      // ✅ store a token to mark user as authenticated
      await AsyncStorage.setItem('authToken', 'demo-token');

      // ✅ trigger navigation
      if (onSuccess) onSuccess();
      else router.replace('/survey');
    } catch (e) {
      Alert.alert('Sign up failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const wrap = (hasError) => [styles.inputWrapper, hasError ? styles.inputWrapperError : styles.inputWrapperNormal];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join JoiApp to start your wellness journey</Text>
        </View>

        {/* Email */}
        <View style={styles.group}>
          <Text style={styles.label}>Email</Text>
          <View style={wrap(!!errors.email)}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: '' }));
              }}
              returnKeyType="next"
            />
          </View>
          {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.group}>
          <Text style={styles.label}>Password</Text>
          <View style={wrap(!!errors.password)}>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: '' }));
              }}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Confirm Password */}
        <View style={styles.group}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={wrap(!!errors.confirm)}>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                if (errors.confirm) setErrors((e) => ({ ...e, confirm: '' }));
              }}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity onPress={() => setShowConfirm((s) => !s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.toggleText}>{showConfirm ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {!!errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, isLoading ? styles.buttonDisabled : styles.buttonEnabled]}
          onPress={handleSignUp}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>Creating Account...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Already have account */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={styles.signupLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
