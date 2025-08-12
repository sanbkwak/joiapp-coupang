const GAD7_QUESTIONS = [
    { heading: 'GAD-7', question: '지난 2주 동안, 너무 불안하거나 걱정이 많아서 견디기 어려웠습니까?' },
    { heading: 'GAD-7', question: '지난 2주 동안, 너무 걱정 때문에 여러 가지 일에 집중하기 어려웠습니까?' },
    { heading: 'GAD-7', question: '지난 2주 동안, 잘못될 것 같은 느낌이 계속되어 견디기 어려웠습니까?' },
    { heading: 'GAD-7', question: '지난 2주 동안, 불안 때문에 불안정하거나 쉽게 화를 냈습니까?' },
    { heading: 'GAD-7', question: '지난 2주 동안, 두려움 때문에 일상 생활이 어려웠습니까?' },
    { heading: 'GAD-7', question: '지난 2주 동안, 근육 긴장 때문에 아프거나 불편했습니까?' },
    { heading: 'GAD-7', question: '지난 2주 동안, 쉽게 놀라거나 겁을 먹었습니까?' }
];

const PHQ9_QUESTIONS = [
    { heading: 'PHQ-9', question: '지난 2주 동안 업무나 다른 활동을 할 의욕이나 즐거움이 전혀 없었습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 우울하거나, 절망적이거나, 희망이 없다고 느꼈습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 잠들기 어렵거나, 계속 잠을 유지하기 어렵거나, 너무 많이 잤습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 피곤하거나 기력이 없었습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 식욕이 부족하거나, 과식을 했습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 자신을 나쁘게 여기거나, 실패자라고 생각하거나, 자신이나 가족을 실망시켰다고 느꼈습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 집중하는 데 어려움을 겪었습니까? 예를 들어, 신문 읽기나 텔레비전 보기가 어려웠습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 말이나 움직임이 너무 느려졌다고 느꼈습니까? 또는 반대로 너무 안절부절못하거나 들떠서 가만히 있기가 어려웠습니까? 이러한 증상들이 다른 사람들에게도 눈에 띄었습니까?' },
    { heading: 'PHQ-9', question: '지난 2주 동안 자신이 죽었으면 좋겠다는 생각을 하거나, 스스로 해를 입힐 생각을 했습니까?' }
];

const GAD2_QUESTIONS = GAD7_QUESTIONS.slice(0, 2).map(question => ({ ...question, heading: 'GAD-2' }));
const PHQ2_QUESTIONS = PHQ9_QUESTIONS.slice(0, 2).map(question => ({ ...question, heading: 'PHQ-2' }));

const questionList1 = [
    { question: '성함을 말씀해 주세요', answerType: 'text' },
    { question: '출생 년월일을 말씀해 주세요', answerType: 'text' },
    { question: '현재 거주지 주소를 말씀해 주세요', answerType: 'text' },
 
  
];

const questionList2 = [
    { question: '성함을 말씀해 주세요', answerType: 'text' },
    { question: '출생 년월일을 말씀해 주세요', answerType: 'text' },
    { question: '현재 거주지 주소를 말씀해 주세요', answerType: 'text' },
];

const ANSWER_OPTIONS = [
    { label: '전혀 그렇지 않았습니다', value: 0 },
    { label: '여러 날 그랬습니다.', value: 1 },
    { label: '절반 이상의 날들에서 경험했습니다', value: 2 },
    { label: '거의 모든 날 그랬습니다', value: 3 }
];

const YES_NO_OPTIONS = [
    { label: '예', value: '예' },
    { label: '아니오', value: '아니오' }
];

export { GAD7_QUESTIONS, PHQ9_QUESTIONS, GAD2_QUESTIONS, PHQ2_QUESTIONS, ANSWER_OPTIONS, questionList1, questionList2, YES_NO_OPTIONS };
