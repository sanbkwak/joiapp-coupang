import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Easing,
} from 'react-native';
import styles from './OnboardingScreen.styles';

const { width } = Dimensions.get('window');

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInputMethod, setSelectedInputMethod] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState({
    emotion: 0,
    confidence: 0,
  });

  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const steps = [
    { id: 'welcome', title: 'Welcome & Onboarding' },
    { id: 'input-selection', title: 'Emotion Input Selection' },
    { id: 'voice-capture', title: 'Voice Input Capture' },
    { id: 'ai-analysis', title: 'AI Analysis & Processing' },
    { id: 'recommendations', title: 'Wellness Recommendations' },
    { id: 'progress', title: 'Progress & History' },
  ];

  const inputMethods = [
    { id: 'face', icon: '📷', label: 'Face' },
    { id: 'voice', icon: '🎙️', label: 'Voice' },
    { id: 'text', icon: '📝', label: 'Text' },
    { id: 'survey', icon: '👤', label: 'Survey' },
  ];

  const recommendations = [
    {
      id: 1,
      icon: '🫁',
      title: '5-min Breathing Exercise',
      subtitle: 'Reduces stress by 40%',
      color: '#E3F2FD',
      iconColor: '#2196F3',
    },
    {
      id: 2,
      icon: '🚶',
      title: '10-min Walk',
      subtitle: 'Boost mood naturally',
      color: '#E8F5E8',
      iconColor: '#4CAF50',
    },
    {
      id: 3,
      icon: '📞',
      title: 'Call a Friend',
      subtitle: 'Social connection helps',
      color: '#FCE4EC',
      iconColor: '#E91E63',
    },
  ];

  useEffect(() => {
    if (currentStep === 2 && isRecording) {
      startWaveAnimation();
      startRecordingProgress();
    }
  }, [isRecording]);

  useEffect(() => {
    if (currentStep === 3) {
      startAnalysisAnimation();
    }
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width * 0.15,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        // Instantly reset slide and fade for next step
        slideAnim.setValue(width * 0.15);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });

      if (currentStep === 1) {
        setSelectedInputMethod('voice');
      }
      if (currentStep === 2) {
        setTimeout(() => setIsRecording(true), 1000);
      }
    }
  };

  const startWaveAnimation = () => {
    const animations = waveAnims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      )
    );

    // Stagger the animations
    animations.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 100);
    });
  };

  const startRecordingProgress = () => {
    const timer = setInterval(() => {
      setRecordingProgress(prev => {
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

  const startAnalysisAnimation = () => {
    setTimeout(() => {
      Animated.timing(new Animated.Value(0), {
        toValue: 85,
        duration: 1500,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setAnalysisProgress({ emotion: 85, confidence: 85 });
        }
      });
    }, 500);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const renderWelcomeStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>♥</Text>
        </View>
        <Text style={styles.appTitle}>Joi App</Text>
        <Text style={styles.subtitle}>
          AI driven emotional wellness with Metaverse action
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={[styles.featureCard, { borderLeftColor: '#FF5252' }]}>
          <View style={[styles.featureIcon, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.featureIconText, { color: '#FF5252' }]}>♥</Text>
          </View>
          <Text style={styles.featureTitle}>Multimodal Tracking</Text>
          <Text style={styles.featureDescription}>
            Capture emotions through facial recognition, voice analysis, text input, and structured surveys
          </Text>
        </View>

        <View style={[styles.featureCard, { borderLeftColor: '#2196F3' }]}>
          <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
            <Text style={[styles.featureIconText, { color: '#2196F3' }]}>🧠</Text>
          </View>
          <Text style={styles.featureTitle}>AI Analysis</Text>
          <Text style={styles.featureDescription}>
            Advanced machine learning algorithms analyze patterns and provide emotional insights
          </Text>
        </View>

        <View style={[styles.featureCard, { borderLeftColor: '#4CAF50' }]}>
          <View style={[styles.featureIcon, { backgroundColor: '#E8F5E8' }]}>
            <Text style={[styles.featureIconText, { color: '#4CAF50' }]}>📈</Text>
          </View>
          <Text style={styles.featureTitle}>Personalized Recommendations</Text>
          <Text style={styles.featureDescription}>
            Receive tailored wellness activities and interventions based on your emotional state
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderInputSelectionStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Emotion Input Selection</Text>
      <Text style={styles.stepSubtitle}>
        User chooses how they want to log their current emotional state
      </Text>

      <View style={styles.inputInterface}>
        <Text style={styles.questionText}>How are you feeling?</Text>
        <Text style={styles.instructionText}>Choose your input method</Text>

        <View style={styles.inputMethodsGrid}>
          {inputMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.inputMethod,
                selectedInputMethod === method.id && styles.inputMethodSelected,
              ]}
              onPress={() => setSelectedInputMethod(method.id)}
            >
              <Text style={styles.inputMethodIcon}>{method.icon}</Text>
              <Text style={styles.inputMethodLabel}>{method.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.moodIndicators}>
          <Text style={styles.moodFace}>😊</Text>
          <Text style={styles.moodFace}>😐</Text>
          <Text style={styles.moodFace}>☹️</Text>
        </View>
      </View>

      <View style={styles.keyFeatures}>
        <Text style={styles.keyFeaturesTitle}>Key Features:</Text>
        {[
          'Four input modalities available',
          'Quick emotion indicator icons',
          'Accessibility options for all users',
          'Multiple inputs can be combined',
        ].map((feature, index) => (
          <Text key={index} style={styles.featureListItem}>
            • {feature}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Continue with Voice</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderVoiceCaptureStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Voice Input Capture</Text>
      <Text style={styles.stepSubtitle}>
        User records their voice describing their emotional state
      </Text>

      <View style={styles.recordingInterface}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={() => {
            if (!isRecording) {
              setIsRecording(true);
              startPulseAnimation();
            }
          }}
        >
          <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
            <Text style={styles.recordButtonIcon}>🎙️</Text>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.recordingStatus}>
          {isRecording ? 'Recording...' : 'Tap to record'}
        </Text>
        <Text style={styles.recordingInstruction}>Tell us how you're feeling</Text>

        {isRecording && (
          <View style={styles.waveform}>
            {waveAnims.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  { transform: [{ scaleY: anim }] }
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${recordingProgress}%` }]} />
        </View>

        {isRecording && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#FF5252' }]}
            onPress={() => {
              setIsRecording(false);
              setTimeout(() => nextStep(), 500);
            }}
          >
            <Text style={styles.primaryButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.keyFeatures}>
        <Text style={styles.keyFeaturesTitle}>Key Features:</Text>
        {[
          'Real-time audio visualization',
          'Voice pattern analysis',
          'Emotion detection from tone and speech',
          'Privacy-focused local processing',
        ].map((feature, index) => (
          <Text key={index} style={styles.featureListItem}>
            • {feature}
          </Text>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalysisStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>AI Analysis & Processing</Text>
      <Text style={styles.stepSubtitle}>
        The app analyzes all collected data to understand emotional state
      </Text>

      <View style={styles.analysisInterface}>
        <View style={styles.analysisIcon}>
          <Text style={styles.analysisIconText}>⏱️</Text>
        </View>
        <Text style={styles.analysisTitle}>AI Analysis</Text>
        <Text style={styles.analysisSubtitle}>Processing your emotional data...</Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Emotion Detection</Text>
            <Text style={styles.metricValue}>Stressed</Text>
          </View>
          <View style={styles.metricBar}>
            <View style={[styles.metricFill, { width: '85%', backgroundColor: '#FF5252' }]} />
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Confidence Level</Text>
            <Text style={styles.metricValue}>85%</Text>
          </View>
          <View style={styles.metricBar}>
            <View style={[styles.metricFill, { width: '85%', backgroundColor: '#1A1A1A' }]} />
          </View>
        </View>

        <View style={styles.insightsBox}>
          <Text style={styles.insightsTitle}>Insights</Text>
          <Text style={styles.insightsText}>
            Your voice indicates elevated stress levels. Physical tension detected in facial expression.
          </Text>
        </View>
      </View>

      <View style={styles.keyFeatures}>
        <Text style={styles.keyFeaturesTitle}>Key Features:</Text>
        {[
          'Multi-modal data fusion',
          'Real-time emotion classification',
          'Confidence scoring',
          'Pattern recognition over time',
        ].map((feature, index) => (
          <Text key={index} style={styles.featureListItem}>
            • {feature}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>View Recommendations</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRecommendationsStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Wellness Recommendations</Text>
      <Text style={styles.stepSubtitle}>
        Personalized activities suggested based on emotional analysis
      </Text>

      <View style={styles.recommendationsInterface}>
        <View style={[styles.analysisIcon, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.analysisIconText}>📈</Text>
        </View>
        <Text style={styles.analysisTitle}>Recommendations</Text>
        <Text style={styles.analysisSubtitle}>Personalized wellness activities</Text>

        <View style={styles.recommendationsList}>
          {recommendations.map((rec) => (
            <TouchableOpacity key={rec.id} style={styles.recommendation}>
              <View style={[styles.recIcon, { backgroundColor: rec.color }]}>
                <Text style={[styles.recIconText, { color: rec.iconColor }]}>{rec.icon}</Text>
              </View>
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recSubtitle}>{rec.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Activity</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.keyFeatures}>
        <Text style={styles.keyFeaturesTitle}>Key Features:</Text>
        {[
          'Evidence-based wellness interventions',
          'Difficulty and time-based filtering',
          'Progress tracking for activities',
          'Integration with calendar and reminders',
        ].map((feature, index) => (
          <Text key={index} style={styles.featureListItem}>
            • {feature}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>View Progress</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderProgressStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Progress & History</Text>
      <Text style={styles.stepSubtitle}>
        Long-term tracking of emotional patterns and wellness journey
      </Text>

      <View style={styles.journeyView}>
        <Text style={styles.journeyTitle}>Your Journey</Text>
        <Text style={styles.journeySubtitle}>Emotional wellness over time</Text>

        <View style={styles.journeyItems}>
          <View style={styles.journeyItem}>
            <Text style={styles.journeyItemLabel}>Today</Text>
            <Text style={styles.journeyItemValue}>😊😐☹️</Text>
          </View>
          <View style={styles.journeyItem}>
            <Text style={styles.journeyItemLabel}>Yesterday</Text>
            <Text style={styles.journeyItemValue}>😊😐😐</Text>
          </View>
          <View style={styles.journeyItem}>
            <Text style={styles.journeyItemLabel}>This Week</Text>
            <Text style={[styles.journeyItemValue, { color: '#4CAF50', fontWeight: '600' }]}>
              Improving
            </Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Streak</Text>
          <Text style={styles.streakNumber}>7</Text>
          <Text style={styles.streakDays}>days in a row</Text>
        </View>
      </View>

      <View style={styles.keyFeatures}>
        <Text style={styles.keyFeaturesTitle}>Key Features:</Text>
        {[
          'Emotional trend visualization',
          'Streak tracking and gamification',
          'Weekly/monthly insights reports',
          'Export data for healthcare providers',
        ].map((feature, index) => (
          <Text key={index} style={styles.featureListItem}>
            • {feature}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: '#667EEA' }]}
        onPress={() => {
          // Handle completion
          alert('Welcome to Joi App! 🎉\n\nYour emotional wellness journey begins now.');
        }}
      >
        <Text style={styles.primaryButtonText}>Start Using Joi App</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcomeStep();
      case 1: return renderInputSelectionStep();
      case 2: return renderVoiceCaptureStep();
      case 3: return renderAnalysisStep();
      case 4: return renderRecommendationsStep();
      case 5: return renderProgressStep();
      default: return renderWelcomeStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` }
            ]}
          />
        </View>
      </View>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <Text style={styles.stepIndicatorText}>
          Step {currentStep + 1} {currentStep === 1 ? '- Current' : ''}
        </Text>
      </View>
      {/* Animated Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {renderCurrentStep()}
      </Animated.View>
    </SafeAreaView>
  );
};

export default Onboarding;