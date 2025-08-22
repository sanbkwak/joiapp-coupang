// app/screens/Login/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import styles from './LoginScreen.styles';

export default function LoginScreen({ onSuccess }) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleLogin = async () => {
    // simple client-side validation
    setEmailError('');
    setPasswordError('');
    let hasErrors = false;

    if (!email) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (hasErrors) return;

    setIsLoading(true);
    try {
      // TODO: replace with real API call
      await new Promise((r) => setTimeout(r, 1200));

      // ✅ store a token to mark user as authenticated
      await AsyncStorage.setItem('authToken', 'demo-token');

      // ✅ trigger navigation
      if (onSuccess) onSuccess();
      else router.replace('/survey');
    } catch (e) {
      Alert.alert('Login failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>JoiApp</Text>
          <Text style={styles.subtitle}>Welcome back! Please sign in</Text>
        </View>

        {/* Email */}
        <View style={styles.group}>
          <Text style={styles.label}>Email</Text>
          <View
            style={[
              styles.inputWrapper,
              emailError ? styles.inputWrapperError : styles.inputWrapperNormal,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError('');
              }}
              returnKeyType="next"
            />
          </View>
          {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
        </View>

        {/* Password */}
        <View style={styles.group}>
          <Text style={styles.label}>Password</Text>
          <View
            style={[
              styles.inputWrapper,
              passwordError
                ? styles.inputWrapperError
                : styles.inputWrapperNormal,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (passwordError) setPasswordError('');
              }}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.toggleText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
          {!!passwordError && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}
        </View>

        {/* Forgot Password */}
        <View style={styles.rightRow}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Not implemented', 'Password reset coming soon.')
            }
          >
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.button,
            isLoading ? styles.buttonDisabled : styles.buttonEnabled,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                Signing In...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Go to Sign Up */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>No account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
