const GAD7_QUESTIONS = [
    { heading: 'GAD-7', question: 'Over the last 2 weeks, have you felt excessively anxious or worried?' },
    { heading: 'GAD-7', question: 'Over the last 2 weeks, did you have trouble concentrating because of worry?' },
    { heading: 'GAD-7', question: 'Over the last 2 weeks, did you feel overwhelmed by a sense of doom or fear something bad would happen?' },
    { heading: 'GAD-7', question: 'Over the last 2 weeks, did you feel on edge or irritable due to anxiety?' },
    { heading: 'GAD-7', question: 'Over the last 2 weeks, did fear interfere with your daily life?' },
    { heading: 'GAD-7', question: 'Over the last 2 weeks, did you feel physical discomfort or tension from muscle tightness?' },
    { heading: 'GAD-7', question: 'Over the last 2 weeks, did you feel easily startled or frightened?' }
];

const PHQ9_QUESTIONS = [
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you had little interest or pleasure in doing things?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you felt down, depressed, or hopeless?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you had trouble falling or staying asleep, or sleeping too much?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you felt tired or had little energy?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you had poor appetite or overeating?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you felt bad about yourself, felt like a failure, or let yourself or your family down?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you had trouble concentrating on things like reading or watching TV?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you been moving or speaking so slowly that other people could have noticed, or the opposite — being so fidgety or restless that you’ve been moving around a lot more than usual?' },
    { heading: 'PHQ-9', question: 'Over the last 2 weeks, have you had thoughts that you would be better off dead or hurting yourself in some way?' }
];

const GAD2_QUESTIONS = GAD7_QUESTIONS.slice(0, 2).map(question => ({ ...question, heading: 'GAD-2' }));
const PHQ2_QUESTIONS = PHQ9_QUESTIONS.slice(0, 2).map(question => ({ ...question, heading: 'PHQ-2' }));

const questionList1 = [

          // I'M SAFE Checklist as yes/no
  { question: 'Do you have any symptoms of illness?', answerType: 'yesNo' },                // Illness
  { question: 'Have you been taking prescription or over-the-counter medication?', answerType: 'yesNo' },  // Medication
  { question: 'Are you experiencing psychological stress related to job, finances, health, or family matters?', answerType: 'yesNo' }, // Stress
  { question: 'Have you consumed alcohol within the last 8 or 24 hours?', answerType: 'yesNo' }, // Alcohol
  { question: 'Are you feeling tired or not adequately rested?', answerType: 'yesNo' },     // Fatigue
  { question: 'Are you emotionally upset?', answerType: 'yesNo' } ,

  { question: 'Please state your full name.', answerType: 'text' },
  { question: 'Please provide your date of birth.', answerType: 'text' },
  { question: 'Please provide your current residential address.', answerType: 'text' },
];

const questionList2 = [

      // I'M SAFE Checklist as yes/no
  { question: 'Do you have any symptoms of illness?', answerType: 'yesNo' },                // Illness
  { question: 'Have you been taking prescription or over-the-counter medication?', answerType: 'yesNo' },  // Medication
  { question: 'Are you experiencing psychological stress related to job, finances, health, or family matters?', answerType: 'yesNo' }, // Stress
  { question: 'Have you consumed alcohol within the last 8 or 24 hours?', answerType: 'yesNo' }, // Alcohol
  { question: 'Are you feeling tired or not adequately rested?', answerType: 'yesNo' },     // Fatigue
  { question: 'Are you emotionally upset?', answerType: 'yesNo' } ,

  { question: 'Please state your full name.', answerType: 'text' },
  { question: 'Please provide your date of birth.', answerType: 'text' },
  { question: 'Please provide your current residential address.', answerType: 'text' },
];

const ANSWER_OPTIONS = [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },


];

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
];

export { GAD7_QUESTIONS, PHQ9_QUESTIONS, GAD2_QUESTIONS, PHQ2_QUESTIONS, ANSWER_OPTIONS, questionList1, questionList2, YES_NO_OPTIONS };
