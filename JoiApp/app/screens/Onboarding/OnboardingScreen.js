import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import styles from './OnboardingScreen.styles';

/**
 * Props:
 * - onFinish: () => void   // called when Step 2 CTA is pressed
 */
export default function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(1); // 1 | 2

  const StepPill = ({ label }) => (
    <View style={styles.stepPill}>
      <Text style={styles.stepPillText}>{label}</Text>
    </View>
  );

  const FeatureCard = ({ color, emoji, title, subtitle }) => (
    <View style={[styles.featureCard, { borderLeftColor: color }]}>
      <View style={styles.featureEmojiWrap}>
        <Text style={styles.featureEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </View>
  );

  const ProgressBar = () => (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: step === 1 ? '50%' : '100%' },
        ]}
      />
    </View>
  );

  const renderStep1 = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ProgressBar />
      <StepPill label="Step 1" />

      {/* Identity / hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroIconEmoji}>🤍</Text>
        </View>
        <Text style={styles.heroTitle}>Joi App</Text>
        <Text style={styles.heroSubtitle}>
          AI driven emotional wellness with Metaverse action
        </Text>
      </View>

      {/* Feature cards */}
      <FeatureCard
        color="#EF4444"
        emoji="❤️"
        title="Multimodal Tracking"
        subtitle="Capture emotions through facial recognition, voice analysis, text input, and structured surveys"
      />
      <FeatureCard
        color="#3B82F6"
        emoji="🧠"
        title="AI Analysis"
        subtitle="Advanced machine learning algorithms analyze patterns and provide emotional insights"
      />
      <FeatureCard
        color="#10B981"
        emoji="📈"
        title="Personalized Recommendations"
        subtitle="Receive tailored wellness activities and interventions based on your emotional state"
      />

      {/* CTA */}
      <TouchableOpacity style={styles.ctaPrimary} onPress={() => setStep(2)}>
        <Text style={styles.ctaPrimaryText}>Get Started</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ProgressBar />
      <StepPill label="Step 2 - Current" />

      {/* Section title */}
      <Text style={styles.sectionTitle}>Emotion Input Selection</Text>
      <Text style={styles.sectionSubtitle}>
        User chooses how they want to log their current emotional state
      </Text>

      {/* Input card */}
      <View style={styles.inputCard}>
        <Text style={styles.inputQuestion}>How are you feeling?</Text>
        <Text style={styles.inputSub}>Choose your input method</Text>

        {/* 2×2 grid */}
        <View style={styles.inputGrid}>
          <TouchableOpacity style={styles.inputButton}>
            <Text style={styles.inputIcon}>📷</Text>
            <Text style={styles.inputLabel}>Face</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inputButton}>
            <Text style={styles.inputIcon}>🎤</Text>
            <Text style={styles.inputLabel}>Voice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inputButton}>
            <Text style={styles.inputIcon}>📝</Text>
            <Text style={styles.inputLabel}>Text</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inputButton}>
            <Text style={styles.inputIcon}>👤</Text>
            <Text style={styles.inputLabel}>Survey</Text>
          </TouchableOpacity>
        </View>

        {/* emoji quick indicators (single row) */}
        <View style={styles.emojiRow}>
          <Text style={styles.emoji}>😊</Text>
          <Text style={styles.emoji}>😐</Text>
          <Text style={styles.emoji}>😞</Text>
        </View>
      </View>

      {/* Key features list */}
      <View style={styles.keyListWrap}>
        <Text style={styles.keyListTitle}>Key Features:</Text>
        <Text style={styles.keyItem}>• Four input modalities available</Text>
        <Text style={styles.keyItem}>• Quick emotion indicator icons</Text>
        <Text style={styles.keyItem}>• Accessibility options for all users</Text>
        <Text style={styles.keyItem}>• Multiple inputs can be combined</Text>
      </View>

      {/* Final CTA */}
      <TouchableOpacity style={styles.ctaPrimary} onPress={onFinish}>
        <Text style={styles.ctaPrimaryText}>Continue</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 1 ? renderStep1() : renderStep2()}
    </SafeAreaView>
  );
}
