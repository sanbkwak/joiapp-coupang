// app/screens/OnboardingScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import styles from './OnboardingScreen.styles'; // keep your styles next to this file

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  const steps = [
    { id: 'welcome', title: 'Welcome & Onboarding' },
    { id: 'input-selection', title: 'Emotion Input Selection' },
    { id: 'voice-capture', title: 'Voice Input Capture' },
    { id: 'ai-analysis', title: 'AI Analysis & Processing' },
    { id: 'recommendations', title: 'Wellness Recommendations' },
    { id: 'progress', title: 'Progress & History' }, // final
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInputMethod, setSelectedInputMethod] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [analysisProgress] = useState({ emotion: 85, confidence: 85 });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(1))).current;

  const animateToNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -width * 0.15, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep((s) => s + 1);
      slideAnim.setValue(width * 0.15);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const nextStep = () => {
    if (currentStep >= steps.length - 1) return;
    animateToNext();
    if (currentStep === 1) setSelectedInputMethod('voice');
    if (currentStep === 2) setTimeout(() => setIsRecording(true), 600);
  };

  const startWaveAnimation = () => {
    waveAnims.forEach((anim) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 2, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const startRecordingProgress = () => {
    const timer = setInterval(() => {
      setRecordingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsRecording(false);
          setTimeout(() => nextStep(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  useEffect(() => {
    if (currentStep === 2 && isRecording) {
      startWaveAnimation();
      startPulseAnimation();
      startRecordingProgress();
    }
  }, [currentStep, isRecording]);

  // Finish onboarding → set flag → go to /auth/login
  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/auth/login');
  };

  const renderWelcome = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}><Text style={styles.logoText}>♥</Text></View>
        <Text style={styles.appTitle}>Joi App</Text>
        <Text style={styles.subtitle}>AI driven emotional wellness with Metaverse action</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={[styles.featureCard, { borderLeftColor: '#FF5252' }]}>
          <View style={[styles.featureIcon, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.featureIconText, { color: '#FF5252' }]}>♥</Text>
          </View>
          <Text style={styles.featureTitle}>Multimodal Tracking</Text>
          <Text style={styles.featureDescription}>Face, voice, text, and surveys</Text>
        </View>
        <View style={[styles.featureCard, { borderLeftColor: '#2196F3' }]}>
          <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
            <Text style={[styles.featureIconText, { color: '#2196F3' }]}>🧠</Text>
          </View>
          <Text style={styles.featureTitle}>AI Insights</Text>
          <Text style={styles.featureDescription}>Real-time signal analysis & trends</Text>
        </View>
        <View style={[styles.featureCard, { borderLeftColor: '#4CAF50' }]}>
          <View style={[styles.featureIcon, { backgroundColor: '#E8F5E8' }]}>
            <Text style={[styles.featureIconText, { color: '#4CAF50' }]}>📈</Text>
          </View>
          <Text style={styles.featureTitle}>Personalized Actions</Text>
          <Text style={styles.featureDescription}>Recommendations tailored to you</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderInputSelection = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Emotion Input Selection</Text>
      <Text style={styles.stepSubtitle}>Choose how you want to log your current state</Text>

      <View style={styles.inputInterface}>
        <Text style={styles.questionText}>How are you feeling?</Text>
        <Text style={styles.instructionText}>Pick an input method</Text>

        <View style={styles.inputMethodsGrid}>
          {[
            { id: 'face', icon: '📷', label: 'Face' },
            { id: 'voice', icon: '🎙️', label: 'Voice' },
            { id: 'text', icon: '📝', label: 'Text' },
            { id: 'survey', icon: '👤', label: 'Survey' },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.inputMethod, selectedInputMethod === m.id && styles.inputMethodSelected]}
              onPress={() => setSelectedInputMethod(m.id)}
            >
              <Text style={styles.inputMethodIcon}>{m.icon}</Text>
              <Text style={styles.inputMethodLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.moodIndicators}>
          <Text style={styles.moodFace}>😊</Text>
          <Text style={styles.moodFace}>😐</Text>
          <Text style={styles.moodFace}>☹️</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Continue with Voice</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderVoiceCapture = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Voice Input Capture</Text>
      <Text style={styles.stepSubtitle}>Record how you're feeling right now</Text>

      <View style={styles.recordingInterface}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={() => { if (!isRecording) setIsRecording(true); }}
        >
          <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
            <Text style={styles.recordButtonIcon}>🎙️</Text>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.recordingStatus}>{isRecording ? 'Recording...' : 'Tap to record'}</Text>
        <Text style={styles.recordingInstruction}>Speak freely for a few seconds</Text>

        {isRecording && (
          <View style={styles.waveform}>
            {waveAnims.map((anim, i) => (
              <Animated.View key={i} style={[styles.waveBar, { transform: [{ scaleY: anim }] }]} />
            ))}
          </View>
        )}

        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${recordingProgress}%` }]} />
        </View>

        {isRecording && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#FF5252' }]}
            onPress={() => { setIsRecording(false); setTimeout(() => nextStep(), 400); }}
          >
            <Text style={styles.primaryButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderAnalysis = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>AI Analysis & Processing</Text>
      <Text style={styles.stepSubtitle}>We analyze your signals to understand your state</Text>

      <View style={styles.analysisInterface}>
        <View style={styles.analysisIcon}><Text style={styles.analysisIconText}>⏱️</Text></View>
        <Text style={styles.analysisTitle}>AI Analysis</Text>
        <Text style={styles.analysisSubtitle}>Processing your emotional data...</Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Emotion Detection</Text>
            <Text style={styles.metricValue}>Stressed</Text>
          </View>
          <View style={styles.metricBar}>
            <View style={[styles.metricFill, { width: `${analysisProgress.emotion}%`, backgroundColor: '#FF5252' }]} />
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Confidence Level</Text>
            <Text style={styles.metricValue}>{analysisProgress.confidence}%</Text>
          </View>
          <View style={styles.metricBar}>
            <View style={[styles.metricFill, { width: `${analysisProgress.confidence}%`, backgroundColor: '#1A1A1A' }]} />
          </View>
        </View>

        <View style={styles.insightsBox}>
          <Text style={styles.insightsTitle}>Insights</Text>
          <Text style={styles.insightsText}>
            Elevated stress detected. Try a 5-minute breathing exercise or a short walk.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>View Recommendations</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRecommendations = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Wellness Recommendations</Text>
      <Text style={styles.stepSubtitle}>Personalized activities based on your state</Text>

      <View style={styles.featuresContainer}>
        {[
          { id: 1, icon: '🫁', title: '5-min Breathing', subtitle: 'Reduce stress ~40%', c: '#E3F2FD', ic: '#2196F3' },
          { id: 2, icon: '🚶', title: '10-min Walk', subtitle: 'Boost mood naturally', c: '#E8F5E8', ic: '#4CAF50' },
          { id: 3, icon: '📞', title: 'Call a Friend', subtitle: 'Social support matters', c: '#FCE4EC', ic: '#E91E63' },
        ].map((card) => (
          <View key={card.id} style={[styles.featureCard, { borderLeftColor: card.ic, backgroundColor: '#F8F9FA' }]}>
            <View style={[styles.featureIcon, { backgroundColor: card.c }]}>
              <Text style={[styles.featureIconText, { color: card.ic }]}>{card.icon}</Text>
            </View>
            <Text style={styles.featureTitle}>{card.title}</Text>
            <Text style={styles.featureDescription}>{card.subtitle}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderProgress = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Progress & History</Text>
      <Text style={styles.stepSubtitle}>Track improvements and revisit past insights</Text>

      <View style={styles.inputInterface}>
        <Text style={styles.questionText}>Your first week starts now ✨</Text>
        <Text style={styles.instructionText}>Complete a quick daily check-in to build a habit.</Text>
      </View>

      {/* Final CTA → finish onboarding */}
      <TouchableOpacity style={styles.primaryButton} onPress={finishOnboarding}>
        <Text style={styles.primaryButtonText}>Continue to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderByStep = () => {
    switch (currentStep) {
      case 0: return renderWelcome();
      case 1: return renderInputSelection();
      case 2: return renderVoiceCapture();
      case 3: return renderAnalysis();
      case 4: return renderRecommendations();
      case 5: return renderProgress();
      default: return renderWelcome();
    }
  };

  const overallProgress = ((currentStep + 1) / steps.length) * 100;

  return (
    <View style={styles.container}>
      {/* Top progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <Text style={styles.stepIndicatorText}>
          {currentStep + 1} / {steps.length}
        </Text>
      </View>

      {/* Animated content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
        {renderByStep()}
      </Animated.View>
    </View>
  );
}
