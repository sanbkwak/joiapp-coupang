// app/screens/Survey/JoiQuestionnaire.js
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
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CAMERA_HEIGHT = 220; // adjust as needed

const JoiQuestionnaire = () => {
  const { t } = useTranslation();

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

  // ----- Questions (20) with i18n -----
  const questions = [
    {
      id: 1,
      text: t('survey.q1.text', {
        defaultValue: 'How often do you feel mentally or physically exhausted at work?',
      }),
      options: [
        { value: 'A', text: t('survey.q1.A', { defaultValue: 'Never feel that way' }) },
        { value: 'B', text: t('survey.q1.B', { defaultValue: 'Occasionally (once or twice a month)' }) },
        { value: 'C', text: t('survey.q1.C', { defaultValue: 'Sometimes (about once a week)' }) },
        { value: 'D', text: t('survey.q1.D', { defaultValue: 'Often (2–3 times a week)' }) },
        { value: 'E', text: t('survey.q1.E', { defaultValue: 'Always (almost daily)' }) },
      ],
    },
    {
      id: 2,
      text: t('survey.q2.text', {
        defaultValue: 'What is the biggest factor that makes you feel the most anxious?',
      }),
      options: [
        { value: 'A', text: t('survey.q2.A', { defaultValue: 'Excessive workload or tight deadlines' }) },
        { value: 'B', text: t('survey.q2.B', { defaultValue: 'Lack of support or autonomy' }) },
        { value: 'C', text: t('survey.q2.C', { defaultValue: 'Long hours or weekend/overtime work' }) },
        { value: 'D', text: t('survey.q2.D', { defaultValue: 'Goal achievement and performance pressure' }) },
        { value: 'E', text: t('survey.q2.E', { defaultValue: 'Other (workplace relationships)' }) },
      ],
    },
    {
      id: 3,
      text: t('survey.q3.text', {
        defaultValue:
          'How often do you feel anxious or uncomfortable about achieving goals and KPIs?',
      }),
      options: [
        { value: 'A', text: t('survey.q3.A', { defaultValue: 'Never' }) },
        { value: 'B', text: t('survey.q3.B', { defaultValue: 'Almost never' }) },
        { value: 'C', text: t('survey.q3.C', { defaultValue: 'Sometimes' }) },
        { value: 'D', text: t('survey.q3.D', { defaultValue: 'Often' }) },
        { value: 'E', text: t('survey.q3.E', { defaultValue: 'Always' }) },
      ],
    },
    {
      id: 4,
      text: t('survey.q4.text', {
        defaultValue: 'What do you usually tell yourself when you’re struggling at work?',
      }),
      options: [
        { value: 'A', text: t('survey.q4.A', { defaultValue: 'No real worry here' }) },
        { value: 'B', text: t('survey.q4.B', { defaultValue: 'There’s worry but I can handle it' }) },
        { value: 'C', text: t('survey.q4.C', { defaultValue: 'Push through a bit more, then focus' }) },
        { value: 'D', text: t('survey.q4.D', { defaultValue: 'Hard to focus; I’m slipping' }) },
        { value: 'E', text: t('survey.q4.E', { defaultValue: 'It’s unavoidable; I’m overwhelmed' }) },
      ],
    },
    {
      id: 5,
      text: t('survey.q5.text', {
        defaultValue: 'In the past month, have you felt sad or depressed while working?',
      }),
      options: [
        { value: 'A', text: t('survey.q5.A', { defaultValue: 'Never' }) },
        { value: 'B', text: t('survey.q5.B', { defaultValue: 'Almost never' }) },
        { value: 'C', text: t('survey.q5.C', { defaultValue: 'Sometimes' }) },
        { value: 'D', text: t('survey.q5.D', { defaultValue: 'Often' }) },
        { value: 'E', text: t('survey.q5.E', { defaultValue: 'Always' }) },
      ],
    },
    {
      id: 6,
      text: t('survey.q6.text', {
        defaultValue: 'Which best describes your current overall mood?',
      }),
      options: [
        { value: 'A', text: t('survey.q6.A', { defaultValue: 'Fulfilled and satisfied' }) },
        { value: 'B', text: t('survey.q6.B', { defaultValue: 'Down at times but bounce back quickly' }) },
        { value: 'C', text: t('survey.q6.C', { defaultValue: 'Down 2–3 times a week' }) },
        { value: 'D', text: t('survey.q6.D', { defaultValue: 'Often down or pressured' }) },
        { value: 'E', text: t('survey.q6.E', { defaultValue: 'Consistently down' }) },
      ],
    },
    {
      id: 7,
      text: t('survey.q7.text', {
        defaultValue: 'How many nights per week do you have trouble falling or staying asleep?',
      }),
      options: [
        { value: 'A', text: t('survey.q7.A', { defaultValue: '0 days' }) },
        { value: 'B', text: t('survey.q7.B', { defaultValue: '1–2 days' }) },
        { value: 'C', text: t('survey.q7.C', { defaultValue: '3–4 days' }) },
        { value: 'D', text: t('survey.q7.D', { defaultValue: '5–6 days' }) },
        { value: 'E', text: t('survey.q7.E', { defaultValue: 'Almost every day' }) },
      ],
    },
    {
      id: 8,
      text: t('survey.q8.text', {
        defaultValue: 'How energized are you when leading or collaborating with others?',
      }),
      options: [
        { value: 'A', text: t('survey.q8.A', { defaultValue: 'Consistently energized and productive' }) },
        { value: 'B', text: t('survey.q8.B', { defaultValue: 'Somewhat tired but manageable' }) },
        { value: 'C', text: t('survey.q8.C', { defaultValue: 'Often tired; need breaks' }) },
        { value: 'D', text: t('survey.q8.D', { defaultValue: 'Usually tired; concentration is hard' }) },
        { value: 'E', text: t('survey.q8.E', { defaultValue: 'Burned out; can’t perform' }) },
      ],
    },
    {
      id: 9,
      text: t('survey.q9.text', {
        defaultValue: 'How much pressure do you feel from Slack/email/pings during the day?',
      }),
      options: [
        { value: 'A', text: t('survey.q9.A', { defaultValue: 'None' }) },
        { value: 'B', text: t('survey.q9.B', { defaultValue: 'Slight, sometimes' }) },
        { value: 'C', text: t('survey.q9.C', { defaultValue: 'Moderate, regular' }) },
        { value: 'D', text: t('survey.q9.D', { defaultValue: 'Stressful most of the day' }) },
        { value: 'E', text: t('survey.q9.E', { defaultValue: 'Overwhelming' }) },
      ],
    },
    {
      id: 10,
      text: t('survey.q10.text', {
        defaultValue: 'When you clock out or take a break, how well can you switch off?',
      }),
      options: [
        { value: 'A', text: t('survey.q10.A', { defaultValue: 'Easily switch off and relax' }) },
        { value: 'B', text: t('survey.q10.B', { defaultValue: 'Sometimes switch off; mostly rest' }) },
        { value: 'C', text: t('survey.q10.C', { defaultValue: 'Often keep thinking about work' }) },
        { value: 'D', text: t('survey.q10.D', { defaultValue: 'Immediately worry about work again' }) },
        { value: 'E', text: t('survey.q10.E', { defaultValue: 'Always “ON”; can’t escape' }) },
      ],
    },
    {
      id: 11,
      text: t('survey.q11.text', {
        defaultValue: 'How often do you work after regular hours?',
      }),
      options: [
        { value: 'A', text: t('survey.q11.A', { defaultValue: 'Never' }) },
        { value: 'B', text: t('survey.q11.B', { defaultValue: 'Rarely (1–2×/month)' }) },
        { value: 'C', text: t('survey.q11.C', { defaultValue: 'Sometimes (~1×/week)' }) },
        { value: 'D', text: t('survey.q11.D', { defaultValue: 'Often (2–3×/week)' }) },
        { value: 'E', text: t('survey.q11.E', { defaultValue: 'Always (most days)' }) },
      ],
    },
    {
      id: 12,
      text: t('survey.q12.text', {
        defaultValue: 'How is your current work–life balance?',
      }),
      options: [
        { value: 'A', text: t('survey.q12.A', { defaultValue: 'Good balance; plenty of personal time' }) },
        { value: 'B', text: t('survey.q12.B', { defaultValue: 'Recently busy; recovering personal time' }) },
        { value: 'C', text: t('survey.q12.C', { defaultValue: 'Manageable; some recovery' }) },
        { value: 'D', text: t('survey.q12.D', { defaultValue: 'Personal time is scarce' }) },
        { value: 'E', text: t('survey.q12.E', { defaultValue: 'No balance at all' }) },
      ],
    },
    {
      id: 13,
      text: t('survey.q13.text', {
        defaultValue: 'How connected do you feel with your team/colleagues?',
      }),
      options: [
        { value: 'A', text: t('survey.q13.A', { defaultValue: 'Always connected and supported' }) },
        { value: 'B', text: t('survey.q13.B', { defaultValue: 'Mostly connected; sometimes distant' }) },
        { value: 'C', text: t('survey.q13.C', { defaultValue: 'Neutral' }) },
        { value: 'D', text: t('survey.q13.D', { defaultValue: 'Often lonely or isolated' }) },
        { value: 'E', text: t('survey.q13.E', { defaultValue: 'Not connected at all' }) },
      ],
    },
    {
      id: 14,
      text: t('survey.q14.text', {
        defaultValue: 'How comfortable are you discussing mental health at work?',
      }),
      options: [
        { value: 'A', text: t('survey.q14.A', { defaultValue: 'Very comfortable; open dialogue' }) },
        { value: 'B', text: t('survey.q14.B', { defaultValue: 'Somewhat comfortable with close peers' }) },
        { value: 'C', text: t('survey.q14.C', { defaultValue: 'Neutral' }) },
        { value: 'D', text: t('survey.q14.D', { defaultValue: 'Uncomfortable' }) },
        { value: 'E', text: t('survey.q14.E', { defaultValue: 'Very uncomfortable; avoid it' }) },
      ],
    },
    {
      id: 15,
      text: t('survey.q15.text', {
        defaultValue:
          'In the past 6 months, how often did you face unfair pressure or mistreatment?',
      }),
      options: [
        { value: 'A', text: t('survey.q15.A', { defaultValue: 'Never' }) },
        { value: 'B', text: t('survey.q15.B', { defaultValue: 'Rarely; isolated incidents' }) },
        { value: 'C', text: t('survey.q15.C', { defaultValue: 'Sometimes; intermittent' }) },
        { value: 'D', text: t('survey.q15.D', { defaultValue: 'Often; frequent' }) },
        { value: 'E', text: t('survey.q15.E', { defaultValue: 'Very often; consistent' }) },
      ],
    },
    {
      id: 16,
      text: t('survey.q16.text', {
        defaultValue: 'When a difficult problem hits, what’s the immediate impact?',
      }),
      options: [
        { value: 'A', text: t('survey.q16.A', { defaultValue: 'No real impact' }) },
        { value: 'B', text: t('survey.q16.B', { defaultValue: 'Slight stress or discomfort' }) },
        { value: 'C', text: t('survey.q16.C', { defaultValue: 'Moderate stress; focus/emotions affected' }) },
        { value: 'D', text: t('survey.q16.D', { defaultValue: 'Severe stress; sleep/appetite disturbed' }) },
        { value: 'E', text: t('survey.q16.E', { defaultValue: 'Very severe; need help or miss work' }) },
      ],
    },
    {
      id: 17,
      text: t('survey.q17.text', {
        defaultValue:
          'During conflicts or high-stress situations, how tense do you feel physically?',
      }),
      options: [
        { value: 'A', text: t('survey.q17.A', { defaultValue: 'Never' }) },
        { value: 'B', text: t('survey.q17.B', { defaultValue: 'Rarely' }) },
        { value: 'C', text: t('survey.q17.C', { defaultValue: 'Sometimes' }) },
        { value: 'D', text: t('survey.q17.D', { defaultValue: 'Often' }) },
        { value: 'E', text: t('survey.q17.E', { defaultValue: 'Always' }) },
      ],
    },
    {
      id: 18,
      text: t('survey.q18.text', {
        defaultValue: 'How do you usually cope with work stress?',
      }),
      options: [
        { value: 'A', text: t('survey.q18.A', { defaultValue: 'Talk with friends/family' }) },
        { value: 'B', text: t('survey.q18.B', { defaultValue: 'Relaxation or mindfulness' }) },
        { value: 'C', text: t('survey.q18.C', { defaultValue: 'Games/social media chats' }) },
        { value: 'D', text: t('survey.q18.D', { defaultValue: 'Just push through' }) },
        { value: 'E', text: t('survey.q18.E', { defaultValue: 'Seek professional help' }) },
      ],
    },
    {
      id: 19,
      text: t('survey.q19.text', {
        defaultValue:
          'Do you rely on alcohol, caffeine, or other substances to relieve stress?',
      }),
      options: [
        { value: 'A', text: t('survey.q19.A', { defaultValue: 'Never' }) },
        { value: 'B', text: t('survey.q19.B', { defaultValue: 'Rarely (1–2×)' }) },
        { value: 'C', text: t('survey.q19.C', { defaultValue: 'Sometimes (~monthly)' }) },
        { value: 'D', text: t('survey.q19.D', { defaultValue: 'Often (weekly)' }) },
        { value: 'E', text: t('survey.q19.E', { defaultValue: 'Always (daily or almost daily)' }) },
      ],
    },
    {
      id: 20,
      text: t('survey.q20.text', {
        defaultValue:
          'How supported do you feel using Employee Assistance Programs (EAP, counseling)?',
      }),
      options: [
        { value: 'A', text: t('survey.q20.A', { defaultValue: 'Very supported; easy and encouraged' }) },
        { value: 'B', text: t('survey.q20.B', { defaultValue: 'Somewhat supported; know how to access' }) },
        { value: 'C', text: t('survey.q20.C', { defaultValue: 'Neutral; aware but unclear' }) },
        { value: 'D', text: t('survey.q20.D', { defaultValue: 'Not supported; feels unavailable' }) },
        { value: 'E', text: t('survey.q20.E', { defaultValue: 'Not supported at all' }) },
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
      Alert.alert(
        t('survey.alertSelectTitle', { defaultValue: 'Please select an answer' }),
        t('survey.alertSelectMsg', { defaultValue: 'You must choose an option before continuing.' })
      );
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
      t('survey.completeTitle', { defaultValue: 'Survey Complete! 🎉' }),
      t('survey.completeMsg', {
        defaultValue:
          'Thanks for completing the wellness survey.\n\nYour results:\n• Stress Level: {{level}}\n• Recommendation: {{rec}}',
        level: results.stressLevel,
        rec: results.recommendations,
      }),
      [{ text: t('common.confirm', { defaultValue: 'OK' }) }],
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
      stressLevel = t('survey.result.low', { defaultValue: 'Low' });
      recommendations = t('survey.result.lowRec', {
        defaultValue: 'Keep up healthy routines and mindful breaks.',
      });
    } else if (average <= 3.5) {
      stressLevel = t('survey.result.moderate', { defaultValue: 'Moderate' });
      recommendations = t('survey.result.moderateRec', {
        defaultValue: 'Add stress-management techniques and regular pauses.',
      });
    } else {
      stressLevel = t('survey.result.high', { defaultValue: 'High' });
      recommendations = t('survey.result.highRec', {
        defaultValue: 'Prioritize self-care and consider professional support.',
      });
    }
    return { stressLevel, recommendations, score: average, totalQuestions, completedAt: new Date().toISOString() };
  };

  // ----- Render -----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('survey.headerTitle', { defaultValue: 'Workplace Wellness Survey' })}
        </Text>
        <Text style={styles.headerSubtitle}>
          {t('survey.headerSubtitle', {
            defaultValue: 'Question {{n}} of {{total}}',
            n: currentQuestionIndex + 1,
            total: totalQuestions,
          })}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {t('survey.progress', { defaultValue: '{{p}}% Complete', p: Math.round(progress) })}
        </Text>
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
                  {t('survey.cameraNeeded', {
                    defaultValue: 'Camera permission is required to show the preview.',
                  })}
                </Text>
                {permission?.canAskAgain && (
                  <TouchableOpacity
                    onPress={handleRequestPermission}
                    style={styles.permissionButton}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.permissionButtonText}>
                      {t('survey.grantPermission', { defaultValue: 'Grant Permission' })}
                    </Text>
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
          {t('survey.privacyBanner', {
            defaultValue:
              'Camera footage is not stored. Only the necessary mental health information, analyzed in real time, is encrypted and securely transmitted to the server. We prioritize your privacy above all else.',
          })}
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
            <Text style={styles.prevButtonText}>
              {t('common.back', { defaultValue: '← Previous' })}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedOption}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, !selectedOption && styles.nextButtonTextDisabled]}>
            {currentQuestionIndex === totalQuestions - 1
              ? t('survey.completeCta', { defaultValue: 'Complete Survey' })
              : t('survey.nextCta', { defaultValue: 'Next →' })}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default JoiQuestionnaire;
