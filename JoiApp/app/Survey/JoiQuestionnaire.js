import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import styles from './JoiQuestionnaire.styles';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');
const CAMERA_HEIGHT = 220; // adjust as needed

const JoiQuestionnaire = () => {
  // ----- Camera permission -----
  const [permission, requestPermission] = useCameraPermissions();
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    try {
      setRequesting(true);
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };

  // ----- Survey state -----
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ----- Questions (20) -----
  const questions = [
    {
      id: 1,
      text: 'How often do you feel mentally or physically exhausted at work?',
      options: [
        { value: 'A', text: 'Never feel that way' },
        { value: 'B', text: 'Occasionally (once or twice a month)' },
        { value: 'C', text: 'Sometimes (about once a week)' },
        { value: 'D', text: 'Often (2–3 times a week)' },
        { value: 'E', text: 'Always (almost daily)' },
      ],
    },
    {
      id: 2,
      text: 'What is the biggest factor that makes you feel the most anxious?',
      options: [
        { value: 'A', text: 'Excessive workload or tight deadlines' },
        { value: 'B', text: 'Lack of support or autonomy' },
        { value: 'C', text: 'Long hours or weekend/overtime work' },
        { value: 'D', text: 'Goal achievement and performance pressure' },
        { value: 'E', text: 'Other (workplace relationships)' },
      ],
    },
    {
      id: 3,
      text: 'How often do you feel anxious or uncomfortable about achieving goals and KPIs?',
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Almost never' },
        { value: 'C', text: 'Sometimes' },
        { value: 'D', text: 'Often' },
        { value: 'E', text: 'Always' },
      ],
    },
    {
      id: 4,
      text: 'What do you usually tell yourself when you’re struggling at work?',
      options: [
        { value: 'A', text: 'No real worry here' },
        { value: 'B', text: 'There’s worry but I can handle it' },
        { value: 'C', text: 'Push through a bit more, then focus' },
        { value: 'D', text: 'Hard to focus; I’m slipping' },
        { value: 'E', text: 'It’s unavoidable; I’m overwhelmed' },
      ],
    },
    {
      id: 5,
      text: 'In the past month, have you felt sad or depressed while working?',
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Almost never' },
        { value: 'C', text: 'Sometimes' },
        { value: 'D', text: 'Often' },
        { value: 'E', text: 'Always' },
      ],
    },
    {
      id: 6,
      text: 'Which best describes your current overall mood?',
      options: [
        { value: 'A', text: 'Fulfilled and satisfied' },
        { value: 'B', text: 'Down at times but bounce back quickly' },
        { value: 'C', text: 'Down 2–3 times a week' },
        { value: 'D', text: 'Often down or pressured' },
        { value: 'E', text: 'Consistently down' },
      ],
    },
    {
      id: 7,
      text: 'How many nights per week do you have trouble falling or staying asleep?',
      options: [
        { value: 'A', text: '0 days' },
        { value: 'B', text: '1–2 days' },
        { value: 'C', text: '3–4 days' },
        { value: 'D', text: '5–6 days' },
        { value: 'E', text: 'Almost every day' },
      ],
    },
    {
      id: 8,
      text: 'How energized are you when leading or collaborating with others?',
      options: [
        { value: 'A', text: 'Consistently energized and productive' },
        { value: 'B', text: 'Somewhat tired but manageable' },
        { value: 'C', text: 'Often tired; need breaks' },
        { value: 'D', text: 'Usually tired; concentration is hard' },
        { value: 'E', text: 'Burned out; can’t perform' },
      ],
    },
    {
      id: 9,
      text: 'How much pressure do you feel from Slack/email/pings during the day?',
      options: [
        { value: 'A', text: 'None' },
        { value: 'B', text: 'Slight, sometimes' },
        { value: 'C', text: 'Moderate, regular' },
        { value: 'D', text: 'Stressful most of the day' },
        { value: 'E', text: 'Overwhelming' },
      ],
    },
    {
      id: 10,
      text: 'When you clock out or take a break, how well can you switch off?',
      options: [
        { value: 'A', text: 'Easily switch off and relax' },
        { value: 'B', text: 'Sometimes switch off; mostly rest' },
        { value: 'C', text: 'Often keep thinking about work' },
        { value: 'D', text: 'Immediately worry about work again' },
        { value: 'E', text: 'Always “ON”; can’t escape' },
      ],
    },
    {
      id: 11,
      text: 'How often do you work after regular hours?',
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Rarely (1–2×/month)' },
        { value: 'C', text: 'Sometimes (~1×/week)' },
        { value: 'D', text: 'Often (2–3×/week)' },
        { value: 'E', text: 'Always (most days)' },
      ],
    },
    {
      id: 12,
      text: 'How is your current work–life balance?',
      options: [
        { value: 'A', text: 'Good balance; plenty of personal time' },
        { value: 'B', text: 'Recently busy; recovering personal time' },
        { value: 'C', text: 'Manageable; some recovery' },
        { value: 'D', text: 'Personal time is scarce' },
        { value: 'E', text: 'No balance at all' },
      ],
    },
    {
      id: 13,
      text: 'How connected do you feel with your team/colleagues?',
      options: [
        { value: 'A', text: 'Always connected and supported' },
        { value: 'B', text: 'Mostly connected; sometimes distant' },
        { value: 'C', text: 'Neutral' },
        { value: 'D', text: 'Often lonely or isolated' },
        { value: 'E', text: 'Not connected at all' },
      ],
    },
    {
      id: 14,
      text: 'How comfortable are you discussing mental health at work?',
      options: [
        { value: 'A', text: 'Very comfortable; open dialogue' },
        { value: 'B', text: 'Somewhat comfortable with close peers' },
        { value: 'C', text: 'Neutral' },
        { value: 'D', text: 'Uncomfortable' },
        { value: 'E', text: 'Very uncomfortable; avoid it' },
      ],
    },
    {
      id: 15,
      text: 'In the past 6 months, how often did you face unfair pressure or mistreatment?',
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Rarely; isolated incidents' },
        { value: 'C', text: 'Sometimes; intermittent' },
        { value: 'D', text: 'Often; frequent' },
        { value: 'E', text: 'Very often; consistent' },
      ],
    },
    {
      id: 16,
      text: 'When a difficult problem hits, what’s the immediate impact?',
      options: [
        { value: 'A', text: 'No real impact' },
        { value: 'B', text: 'Slight stress or discomfort' },
        { value: 'C', text: 'Moderate stress; focus/emotions affected' },
        { value: 'D', text: 'Severe stress; sleep/appetite disturbed' },
        { value: 'E', text: 'Very severe; need help or miss work' },
      ],
    },
    {
      id: 17,
      text: 'During conflicts or high-stress situations, how tense do you feel physically?',
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Rarely' },
        { value: 'C', text: 'Sometimes' },
        { value: 'D', text: 'Often' },
        { value: 'E', text: 'Always' },
      ],
    },
    {
      id: 18,
      text: 'How do you usually cope with work stress?',
      options: [
        { value: 'A', text: 'Talk with friends/family' },
        { value: 'B', text: 'Relaxation or mindfulness' },
        { value: 'C', text: 'Games/social media chats' },
        { value: 'D', text: 'Just push through' },
        { value: 'E', text: 'Seek professional help' },
      ],
    },
    {
      id: 19,
      text: 'Do you rely on alcohol, caffeine, or other substances to relieve stress?',
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Rarely (1–2×)' },
        { value: 'C', text: 'Sometimes (~monthly)' },
        { value: 'D', text: 'Often (weekly)' },
        { value: 'E', text: 'Always (daily or almost daily)' },
      ],
    },
    {
      id: 20,
      text: 'How supported do you feel using Employee Assistance Programs (EAP, counseling)?',
      options: [
        { value: 'A', text: 'Very supported; easy and encouraged' },
        { value: 'B', text: 'Somewhat supported; know how to access' },
        { value: 'C', text: 'Neutral; aware but unclear' },
        { value: 'D', text: 'Not supported; feels unavailable' },
        { value: 'E', text: 'Not supported at all' },
      ],
    },
  ];

  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  // ----- Animations -----
  const animateBetween = (dir = 'next') => {
    const offset = dir === 'next' ? -width : width;
    return Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: offset, duration: 0, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]);
  };

  // ----- Handlers -----
  const handleOptionSelect = (option) => setSelectedOption(option);

  const handleNext = () => {
    if (!selectedOption) {
      Alert.alert('Please select an answer', 'You must choose an option before continuing.');
      return;
    }
    const newAnswers = { ...answers, [currentQuestion.id]: selectedOption };
    setAnswers(newAnswers);

    if (currentQuestionIndex < totalQuestions - 1) {
      animateBetween('next').start(() => {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setSelectedOption(newAnswers[questions[nextIndex].id] || null);
      });
    } else {
      handleSurveyComplete(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex === 0) return;
    animateBetween('prev').start(() => {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setSelectedOption(answers[questions[prevIndex].id] || null);
    });
  };

  const handleSurveyComplete = (finalAnswers) => {
    const results = calculateResults(finalAnswers);
    Alert.alert(
      'Survey Complete! 🎉',
      `Thanks for completing the wellness survey.\n\nYour results:\n• Stress Level: ${results.stressLevel}\n• Recommendation: ${results.recommendations}`,
      [{ text: 'OK' }],
    );
  };

  const calculateResults = (surveyAnswers) => {
    let stressScore = 0;
    Object.values(surveyAnswers).forEach((answer) => {
      switch (answer.value) {
        case 'A': stressScore += 1; break;
        case 'B': stressScore += 2; break;
        case 'C': stressScore += 3; break;
        case 'D': stressScore += 4; break;
        case 'E': stressScore += 5; break;
      }
    });
    const average = stressScore / totalQuestions;
    let stressLevel, recommendations;
    if (average <= 2) {
      stressLevel = 'Low';
      recommendations = 'Keep up healthy routines and mindful breaks.';
    } else if (average <= 3.5) {
      stressLevel = 'Moderate';
      recommendations = 'Add stress-management techniques and regular pauses.';
    } else {
      stressLevel = 'High';
      recommendations = 'Prioritize self-care and consider professional support.';
    }
    return { stressLevel, recommendations, score: average, totalQuestions, completedAt: new Date().toISOString() };
  };

  // ----- Render -----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workplace Wellness Survey</Text>
        <Text style={styles.headerSubtitle}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>

      {/* FIXED CAMERA (does not scroll) */}
      <View style={[styles.cameraContainer, { height: CAMERA_HEIGHT }]}>
        {permission?.granted ? (
          <CameraView style={styles.cameraPreview} facing="front" />
        ) : (
          <View style={[styles.cameraPreview, { paddingHorizontal: 16 }]}>
            {requesting ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.cameraOverlayText}>
                  Camera permission is required to show the preview.
                </Text>
                {permission?.canAskAgain && (
                  <TouchableOpacity
                    onPress={handleRequestPermission}
                    style={styles.permissionButton}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* Privacy Message (fixed, just below camera) */}
      <View style={styles.privacyMessageContainer}>
        <Text style={styles.privacyMessageText}>
          Camera footage is not stored. Only the necessary mental health information, analyzed in real time,
          is encrypted and securely transmitted to the server. We prioritize your privacy above all else.
        </Text>
      </View>

      {/* Scrollable content (camera & privacy stay fixed above) */}
      <Animated.View
        style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.questionContainer}>
            <Text style={styles.questionNumber}>Q{currentQuestion.id}</Text>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  selectedOption?.value === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => handleOptionSelect(option)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionRadio,
                      selectedOption?.value === option.value && styles.optionRadioSelected,
                    ]}
                  >
                    {selectedOption?.value === option.value && <View style={styles.optionRadioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedOption?.value === option.value && styles.optionLabelSelected,
                    ]}
                  >
                    {option.value}
                  </Text>
                  <Text
                    style={[
                      styles.optionText,
                      selectedOption?.value === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <Text style={styles.prevButtonText}>← Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedOption}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, !selectedOption && styles.nextButtonTextDisabled]}>
            {currentQuestionIndex === totalQuestions - 1 ? 'Complete Survey' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default JoiQuestionnaire;
