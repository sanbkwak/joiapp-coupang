import React, { useState, useRef } from 'react';
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
} from 'react-native';
import styles from './JoiQuestionnaire.styles.js';

const { width, height } = Dimensions.get('window');

const JoiQuestionnaire = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Survey questions translated from the Korean images
  const questions = [
    {
      id: 1,
      text: "How often do you feel mentally or physically exhausted at work?",
      options: [
        { value: 'A', text: 'Never feel that way' },
        { value: 'B', text: 'Occasionally (once or twice a month)' },
        { value: 'C', text: 'Sometimes (about once a week)' },
        { value: 'D', text: 'Often (2-3 times a week)' },
        { value: 'E', text: 'Always (almost daily)' },
      ],
    },
    {
      id: 2,
      text: "What is the biggest factor that makes you feel the most anxious?",
      options: [
        { value: 'A', text: 'Excessive workload or tight deadlines' },
        { value: 'B', text: 'Clear support or lack of autonomy' },
        { value: 'C', text: 'Long hours or weekend/overtime work' },
        { value: 'D', text: 'Goal achievement and performance pressure' },
        { value: 'E', text: 'Other (workplace relationships)' },
      ],
    },
    {
      id: 3,
      text: "How often do you feel anxious or uncomfortable about achieving goals and KPIs?",
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
      text: "What question do you ask yourself most when you're struggling at work?",
      options: [
        { value: 'A', text: 'Am I not worried enough?' },
        { value: 'B', text: 'There\'s worry but I can handle it' },
        { value: 'C', text: 'I need to endure a little longer and then concentrate' },
        { value: 'D', text: 'It\'s hard to concentrate later' },
        { value: 'E', text: 'It became unavoidable' },
      ],
    },
    {
      id: 5,
      text: "In the past month, have you ever felt sad or depressed while working on a task?",
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
      text: "What situation makes you feel most comfortable right now?",
      options: [
        { value: 'A', text: 'I am completely satisfied and have a sense of fulfillment' },
        { value: 'B', text: 'I feel depressed but will recover quickly' },
        { value: 'C', text: 'I feel depressed 2-3 times' },
        { value: 'D', text: 'I often feel depressed or pressured' },
        { value: 'E', text: 'I always feel down' },
      ],
    },
    {
      id: 7,
      text: "How often do you have trouble sleeping or staying asleep at night during the week?",
      options: [
        { value: 'A', text: 'No problems at all' },
        { value: 'B', text: '1-2 days' },
        { value: 'C', text: '3-4 days' },
        { value: 'D', text: '5-6 days' },
        { value: 'E', text: 'Almost every day' },
      ],
    },
    {
      id: 8,
      text: "When working with colleagues or subordinates, what kind of leadership do you usually exhibit?",
      options: [
        { value: 'A', text: 'Perfect opening and productive' },
        { value: 'B', text: 'Somewhat tired but manageable' },
        { value: 'C', text: 'Often tired or often take walks' },
        { value: 'D', text: 'Almost always tired or having trouble concentrating' },
        { value: 'E', text: 'Each existing function is gone' },
      ],
    },
    {
      id: 9,
      text: "How often do you feel pressure from digital communication platforms (e.g., Slack, email) during the day?",
      options: [
        { value: 'A', text: 'Not at all pressure' },
        { value: 'B', text: 'Slightly stressful sometimes' },
        { value: 'C', text: 'Usually regular and moderate' },
        { value: 'D', text: 'Most of the day feels stressful' },
        { value: 'E', text: 'Completely unbearable feeling' },
      ],
    },
    {
      id: 10,
      text: "What ability do you feel you have when you leave work or take a break?",
      options: [
        { value: 'A', text: 'Easily turn off and relax' },
        { value: 'B', text: 'I can turn it off sometimes but mostly rest' },
        { value: 'C', text: 'I often think about work' },
        { value: 'D', text: 'I immediately need to worry about the same work pressure' },
        { value: 'E', text: 'I\'m always in \'ON\' mode and can\'t escape' },
      ],
    },
    {
      id: 11,
      text: "How often do you work late after regular hours?",
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Almost never (1-2 times a month)' },
        { value: 'C', text: 'Sometimes (about once a week)' },
        { value: 'D', text: 'Often (2-3 times a week)' },
        { value: 'E', text: 'Always (almost daily)' },
      ],
    },
    {
      id: 12,
      text: "How do you rate your current work-life balance?",
      options: [
        { value: 'A', text: 'Sufficient personal time and good balance' },
        { value: 'B', text: 'Recent busy work but personal time recovery' },
        { value: 'C', text: 'Working consistently but some personal time recovery' },
        { value: 'D', text: 'Personal time is scarce due to work priority' },
        { value: 'E', text: 'Work is completely busy and no balance' },
      ],
    },
    {
      id: 13,
      text: "What is your relationship with your team or colleagues like?",
      options: [
        { value: 'A', text: 'Always connected and supportive' },
        { value: 'B', text: 'Mostly connected but sometimes distant' },
        { value: 'C', text: 'Neutral - not particularly close or distant' },
        { value: 'D', text: 'Often feel lonely or socially isolated' },
        { value: 'E', text: 'Not connected at all' },
      ],
    },
    {
      id: 14,
      text: "What is your comfort level when talking to your manager or colleagues about mental health issues?",
      options: [
        { value: 'A', text: 'Very comfortable - open dialogue anywhere' },
        { value: 'B', text: 'Somewhat comfortable - but only with close colleagues' },
        { value: 'C', text: 'Neutral - uncomfortable but manageable' },
        { value: 'D', text: 'Uncomfortable - reluctant to judge' },
        { value: 'E', text: 'Very uncomfortable - avoid completely' },
      ],
    },
    {
      id: 15,
      text: "Have you experienced any troubling, troubling, or excessive pressure from your boss or colleagues in the past 6 months?",
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Rarely - occasional incidents' },
        { value: 'C', text: 'Sometimes - intermittent negative feedback' },
        { value: 'D', text: 'Often - good negative interactions' },
        { value: 'E', text: 'Very often - consistent negative treatment' },
      ],
    },
    {
      id: 16,
      text: "When you feel troubled or have a difficult problem, how does it affect you immediately?",
      options: [
        { value: 'A', text: 'No special impact' },
        { value: 'B', text: 'Slight stress or discomfort' },
        { value: 'C', text: 'Moderate stress - concentration/emotional impact' },
        { value: 'D', text: 'Severe stress - sleep or appetite disturbance' },
        { value: 'E', text: 'Very severe stress - seeking professional help or missing work' },
      ],
    },
    {
      id: 17,
      text: "How often do you feel physically tense or have difficulty working when experiencing workplace conflicts, complaints, or high-stress situations?",
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
      text: "What methods do you mainly use to cope with stressful situations at work?",
      options: [
        { value: 'A', text: 'Immediate conversation with friends/family' },
        { value: 'B', text: 'Use relaxation or mindfulness techniques' },
        { value: 'C', text: 'Casual conversations via games/SNS' },
        { value: 'D', text: 'Just endure and continue working' },
        { value: 'E', text: 'Professional help (counseling) request' },
      ],
    },
    {
      id: 19,
      text: "Do you rely on alcohol, caffeine, or other substances to help relieve work stress?",
      options: [
        { value: 'A', text: 'Never' },
        { value: 'B', text: 'Rarely - 1-2 times' },
        { value: 'C', text: 'Sometimes - about once a month' },
        { value: 'D', text: 'Often - weekly' },
        { value: 'E', text: 'Always - daily or almost daily' },
      ],
    },
    {
      id: 20,
      text: "How long do you feel supported when using an Employee Assistance Program (EAP, counseling, etc.)?",
      options: [
        { value: 'A', text: 'Very supportive - easy and encouraged' },
        { value: 'B', text: 'Somewhat supportive - knows how to use but not well known' },
        { value: 'C', text: 'Neutral - recognizes but not specific' },
        { value: 'D', text: 'Not supportive - feels there is no help available' },
        { value: 'E', text: 'Not supported at all' },
      ],
    },
  ];

  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (!selectedOption) {
      Alert.alert('Please select an answer', 'You must choose an option before continuing.');
      return;
    }

    // Save the answer
    const newAnswers = {
      ...answers,
      [questions[currentQuestionIndex].id]: selectedOption,
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < totalQuestions - 1) {
      // Animate to next question
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(newAnswers[questions[currentQuestionIndex + 1]?.id] || null);
    } else {
      // Survey completed
      handleSurveyComplete(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[questions[currentQuestionIndex - 1].id] || null);
    }
  };

  const handleSurveyComplete = (finalAnswers) => {
    // Calculate results based on answers
    const results = calculateResults(finalAnswers);
    
    Alert.alert(
      'Survey Complete! 🎉',
      `Thank you for completing the workplace wellness survey.\n\nYour results:\n• Stress Level: ${results.stressLevel}\n• Recommendations: ${results.recommendations}\n\nThese insights will help personalize your Joi App experience.`,
      [
        {
          text: 'View Detailed Results',
          onPress: () => {
            console.log('Navigate to results screen', results);
          },
        },
      ]
    );
  };

  const calculateResults = (surveyAnswers) => {
    // Simple scoring algorithm
    let stressScore = 0;

    Object.values(surveyAnswers).forEach((answer) => {
      switch (answer.value) {
        case 'A':
          stressScore += 1;
          break;
        case 'B':
          stressScore += 2;
          break;
        case 'C':
          stressScore += 3;
          break;
        case 'D':
          stressScore += 4;
          break;
        case 'E':
          stressScore += 5;
          break;
      }
    });

    const averageScore = stressScore / totalQuestions;
    let stressLevel, recommendations;

    if (averageScore <= 2) {
      stressLevel = 'Low Stress';
      recommendations = 'Continue your healthy habits and stay mindful';
    } else if (averageScore <= 3.5) {
      stressLevel = 'Moderate Stress';
      recommendations = 'Consider stress management techniques and regular breaks';
    } else {
      stressLevel = 'High Stress';
      recommendations = 'Prioritize self-care and consider professional support';
    }

    return {
      stressLevel,
      recommendations,
      score: averageScore,
      totalQuestions,
      completedAt: new Date().toISOString(),
    };
  };

  const currentQuestion = questions[currentQuestionIndex];

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

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${progress}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>

      {/* Question Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
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
            {currentQuestion.options.map((option, index) => (
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
                  <View style={[
                    styles.optionRadio,
                    selectedOption?.value === option.value && styles.optionRadioSelected,
                  ]}>
                    {selectedOption?.value === option.value && (
                      <View style={styles.optionRadioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    selectedOption?.value === option.value && styles.optionLabelSelected,
                  ]}>
                    {option.value}
                  </Text>
                  <Text style={[
                    styles.optionText,
                    selectedOption?.value === option.value && styles.optionTextSelected,
                  ]}>
                    {option.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Navigation Buttons */}
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
          style={[
            styles.navButton,
            styles.nextButton,
            !selectedOption && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedOption}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.nextButtonText,
            !selectedOption && styles.nextButtonTextDisabled,
          ]}>
            {currentQuestionIndex === totalQuestions - 1 ? 'Complete Survey' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default JoiQuestionnaire;