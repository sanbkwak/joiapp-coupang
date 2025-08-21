import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import AppLayout, { 
  AppSection, 
  AppFormGroup, 
  AppButton, 
  AppStatusMessage 
} from './components/layout/AppLayout';
import JoiAppLogo from './joiapplogo.png'; 
import { useLogout } from './utils/logout.js';
import { getAuthToken } from './utils/authUtility';

// Company-wide stats for every question
const COMPANY_STATS = {
  A: 2,
  B: 5,
  C: 20,
  D: 40,
  E: 33,
}

// Your 20 questions translated to Korean
const QUESTIONS = [
  {
    id: 1,
    text: "업무로 인해 신체적 또는 정서적으로 지쳤다고 느낀 적이 얼마나 자주 있습니까?",
    options: {
      A: "전혀 느라지 않았다",
      B: "가끔(한두 번)",
      C: "때때로(주 1회 정도)",
      D: "자주(주 2~3회)",
      E: "항상(거의 매일)"
    }
  },
  {
    id: 2,
    text: "번아웃을 가장 크게 느라게 하는 요인은 무엇입니까?",
    options: {
      A: "과도한 업무량 또는 빠듯한 마감 기한",
      B: "명확한 지침이나 자원 부족",
      C: "장시간 근무 또는 야간/교대 근무",
      D: "성과 지표 달성 압박",
      E: "기타(직접 입력)"
    },
    allowFreeText: true
  },
  {
    id: 3,
    text: "성과 목표(KPI)를 달성해야 한다는 불안감을 얼마나 자주 느라십니까?",
    options: { A:"전혀", B:"거의 없음", C:"가끔", D:"자주", E:"항상" }
  },
  {
    id: 4,
    text: "업무상의 실수에 대해 걱정할 때 당신의 반응을 가장 잘 설명하는 문장은 무엇입니까?",
    options: {
      A: "거의 걱정하지 않는다",
      B: "걱정은 되지만 곧 잊는다",
      C: "짧게 고민 후 다시 집중한다",
      D: "이후에 집중하기 어렵다",
      E: "마비되어 회피하게 된다"
    }
  },
  {
    id: 5,
    text: "지난 한 달 동안, 평소 즐기던 일에 대해 슬프거나 무관심함을 느낀 적이 얼마나 자주 있습니까?",
    options: { A:"전혀", B:"거의 없음", C:"가끔", D:"자주", E:"항상" }
  },
  {
    id: 6,
    text: "현재 기분 상태에 가장 잘 맞는 문장은 무엇입니까?",
    options: {
      A: "전반적으로 만족스럽고 몰입감이 있다",
      B: "가끔 우울하지만 금세 회복된다",
      C: "주 2~3회 우울감을 느낀다",
      D: "자주 절망적이거나 압도된다",
      E: "거의 모든 것에 흥미를 잃었다"
    }
  },
  {
    id: 7,
    text: "일주일 중 몇 밤 동안 잠들기 어렵거나 자주 깨거나 개운하지 못했습니까?",
    options: {
      A: "전혀 문제가 없었다",
      B: "1~2일",
      C: "3~4일",
      D: "5~6일",
      E: "거의 매일"
    }
  },
  {
    id: 8,
    text: "교대근무나 야간 근무 시 낮에 체감하는 컨디션은 어떻습니까?",
    options: {
      A: "완전히 깨어있고 생산적이다",
      B: "약간 피곤하지만 관리 가능하다",
      C: "자주 피로하거나 주의 산만하다",
      D: "거의 항상 졸리거나 집중 못 한다",
      E: "각성제 없이는 기능 불가"
    }
  },
  {
    id: 9,
    text: "하루 중 디지털 커뮤니케이션(예: Slack, 이메일) 양 때문에 얼마나 압도감을 느라십니까?",
    options: {
      A: "전혀 압도되지 않는다",
      B: "가끔 약간 압도된다",
      C: "보통 수준으로 정기적이다",
      D: "대부분의 날 매우 압도된다",
      E: "완전히 감당 불가하다"
    }
  },
  {
    id: 10,
    text: "근무 시간이 끝난 후 업무에서 벗어나 휴식하는 능력은 어떻습니까?",
    options: {
      A: "쉽게 분리되어 휴식한다",
      B: "가끔 확인하지만 대부분은 휴식한다",
      C: "자주 근무를 생각한다",
      D: "즉시 응답해야 할 것 같은 압박감이 든다",
      E: "항상 'ON' 상태여서 벗어날 수 없다"
    }
  },
  {
    id: 11,
    text: "일정 시간 외에 추가로 근무하는 빈도는 얼마나 됩니까?",
    options: {
      A: "전혀",
      B: "거의 없음(한 달에 1~2회)",
      C: "가끔(주 1회)",
      D: "자주(주 2~3회)",
      E: "항상(거의 매일)"
    }
  },
  {
    id: 12,
    text: "현재 워라밸(일과 삶의 균형)을 어떻게 평가하십니까?",
    options: {
      A: "충분한 개인/가족 시간과 경계가 있다",
      B: "가끔 긴급 업무로 개인 시간을 포기한다",
      C: "일관되게 늦게까지 일하며 일부 시간 포기",
      D: "업무 우선으로 개인 시간이 거의 없다",
      E: "업무가 전부이며 경계가 없다"
    }
  },
  {
    id: 13,
    text: "팀원 또는 동료와의 유대감은 어떻습니까?",
    options: {
      A: "항상 연결되어 있고 지원받는다",
      B: "대부분 연결되지만 가끔은 거리감",
      C: "중립—특별히 가깝지도 멀지도 않다",
      D: "자주 고립감이나 소외감을 느낀다",
      E: "전혀 연결되지 않는다"
    }
  },
  {
    id: 14,
    text: "매니저나 동료에게 정신건강 문제를 이야기하는 편안함은 어떻습니까?",
    options: {
      A: "매우 편안—누구에게나 열린 대화",
      B: "다소 편안—믿을 만한 동료와만",
      C: "중립—이해받을지 불확실",
      D: "불편—판단받을까 두렵다",
      E: "매우 불편—피하고 싶다"
    }
  },
  {
    id: 15,
    text: "지난 6개월간 상사로부터 괴롭힘, 괴롭힘 또는 과도한 압박을 경험하거나 목격한 적이 있습니까?",
    options: {
      A: "전혀 없음",
      B: "드물게—가벼운 사건",
      C: "때때로—간헐적 부정적 피드백",
      D: "자주—잦은 부정적 상호작용",
      E: "매우 자주—일관된 적대적 분위기"
    }
  },
  {
    id: 16,
    text: "괴롭힘이나 과도한 압박을 겪었다면, 그것이 당신에게 어떻게 영향을 미쳤습니까?",
    options: {
      A: "특별한 영향 없음",
      B: "약간의 스트레스나 불편함",
      C: "중간 정도 스트레스—집중력/기분 영향",
      D: "심각한 스트레스—결근 또는 성과 저하",
      E: "매우 큰 고통—퇴사 고려 또는 도움 요청"
    }
  },
  {
    id: 17,
    text: "고객 지원·안전·물류 업무 시 난감한 사건이나 고객 응대 때문에 정서적으로 지친 느낌을 얼마나 자주 겪습니까?",
    options: { A:"전혀", B:"드물게", C:"때때로", D:"자주", E:"항상" }
  },
  {
    id: 18,
    text: "업무 스트레스성 사건에 대처할 때 주로 어떤 방법을 사용합니까?",
    options: {
      A: "즉시 친구/가족과 이야기",
      B: "이완 또는 마음챙김 기법 사용",
      C: "게임·SNS 등으로 산만하게 함",
      D: "참아내며 계속 진행",
      E: "전문가 도움(상담) 요청"
    }
  },
  {
    id: 19,
    text: "업무 스트레스를 해소하기 위해 음주, 각성제 또는 기타 물질에 의존한 적이 있습니까?",
    options: {
      A: "전혀 없음",
      B: "드물게—1~2회",
      C: "가끔—한 달에 1회",
      D: "자주—주간",
      E: "항상—매일 또는 거의 매일"
    }
  },
  {
    id: 20,
    text: "기밀 정신건강 지원(EAP, 상담 등)을 이용하는 데 얼마나 지원받고 있다고 느라십니까?",
    options: {
      A: "매우 지원받음—쉽고 권장됨",
      B: "다소 지원받음—알지만 잘 사용 안 함",
      C: "중립—알긴 하지만 절차 불확실",
      D: "지원 미흡—도움이 없다고 느낌",
      E: "전혀 지원받지 못함"
    }
  }
];

// Header Component for consistency
const SurveyHeader = ({ onLogoClick, onLogout }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: 'white'
  }}>
    <div
      onClick={onLogoClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        gap: '12px'
      }}
    >
      <img 
        src={JoiAppLogo} 
        alt="JoiApp Logo" 
        style={{
          height: '32px',
          width: '32px',
          borderRadius: '6px'
        }}
      />
      <span style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827'
      }}>
        JoiApp - 기초 설문
      </span>
    </div>

    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    }}>
      <Link 
        to="/settings" 
        style={{
          fontSize: '14px',
          textDecoration: 'none',
          color: '#6b7280',
          fontWeight: '500'
        }}
      >
        설정
      </Link>
      <AppButton
        variant="outline"
        onClick={onLogout}
        style={{
          padding: '6px 12px',
          fontSize: '14px',
          borderColor: '#dc2626',
          color: '#dc2626'
        }}
      >
        로그아웃
      </AppButton>
    </div>
  </div>
);

// Question Component
const QuestionCard = ({ question, answer, onAnswerChange, otherText, onOtherTextChange }) => (
  <div style={{
    marginBottom: '24px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: 'white'
  }}>
    <h3 style={{
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '16px',
      lineHeight: '1.5'
    }}>
      {question.id}. {question.text}
    </h3>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Object.entries(question.options).map(([opt, label]) => (
        <label
          key={opt}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            backgroundColor: answer === opt ? '#eff6ff' : 'transparent',
            border: answer === opt ? '1px solid #3b82f6' : '1px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (answer !== opt) {
              e.target.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (answer !== opt) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          <input
            type="radio"
            name={`q${question.id}`}
            value={opt}
            checked={answer === opt}
            onChange={() => onAnswerChange(question.id, opt)}
            required
            style={{
              marginTop: '2px',
              accentColor: '#3b82f6'
            }}
          />
          <span style={{
            fontSize: '15px',
            lineHeight: '1.5',
            color: '#374151'
          }}>
            <strong style={{ color: '#1f2937' }}>{opt}.</strong> {label}
          </span>
        </label>
      ))}
    </div>

    {question.allowFreeText && answer === 'E' && (
      <div style={{ marginTop: '16px' }}>
        <textarea
          placeholder="직접 입력해주세요..."
          value={otherText || ''}
          onChange={(e) => onOtherTextChange(question.id, e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            lineHeight: '1.5',
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
          }}
        />
      </div>
    )}
  </div>
);

export default function SurveyPage() {
  const [answers, setAnswers] = useState({});
  const [otherTexts, setOtherTexts] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const logout = useLogout();
  const API_URL = 'https://api.joiapp.org';

  // JWT authentication check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_id');
      navigate('/login');
      return;
    }
    
    return response;
  };

  const handleChange = (qid, opt) => {
    setAnswers(a => ({ ...a, [qid]: opt }));
  };

  const handleOtherText = (qid, text) => {
    setOtherTexts(t => ({ ...t, [qid]: text }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (Object.keys(answers).length !== QUESTIONS.length) {
      setError("모든 질문에 답변해 주세요.");
      return;
    }

    setLoading(true);

    const payload = QUESTIONS.map(q => ({
      questionId: q.id,
      answer: answers[q.id],
      freeText: q.allowFreeText && answers[q.id] === "E"
        ? (otherTexts[q.id] || "")
        : null
    }));

    try {
      // Submit survey to Flask backend
      const response = await makeAuthenticatedRequest(`${API_URL}/api/v1/survey/submit`, {
        method: 'POST',
        body: JSON.stringify({
          responses: payload,
          surveyType: 'baseline'
        })
      });

      if (response && response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Survey submission failed');
      }
    } catch (e) {
      console.error("Failed to save survey:", e);
      setError("제출에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (!submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <SurveyHeader
          onLogoClick={() => navigate('/dashboard')}
          onLogout={logout}
        />

        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px'
        }}>
          {/* Privacy Notice */}
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: '12px',
            border: '1px solid #93c5fd'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <strong style={{
                fontSize: '16px',
                color: '#1e40af'
              }}>
                익명 보장 안내
              </strong>
            </div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#1e40af',
              lineHeight: '1.5'
            }}>
              이 설문조사는 완전한 익명으로 진행됩니다. 여러분의 응답은 개인 식별 정보와 전혀 연결되지 않으며, 안전하게 보호됩니다.
            </p>
          </div>

          {/* Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              기초 설문조사
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              정신건강과 업무환경에 관한 기초 설문입니다
            </p>
          </div>

          {error && (
            <AppStatusMessage 
              message={error}
              type="error"
              onClose={() => setError(null)}
            />
          )}

          <form onSubmit={handleSubmit}>
            {QUESTIONS.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
                answer={answers[question.id]}
                onAnswerChange={handleChange}
                otherText={otherTexts[question.id]}
                onOtherTextChange={handleOtherText}
              />
            ))}

            <div style={{
              textAlign: 'center',
              marginTop: '40px',
              marginBottom: '40px'
            }}>
              <AppButton
                type="submit"
                variant="primary"
                disabled={loading}
                style={{
                  padding: '16px 32px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                }}
              >
                {loading ? '제출 중...' : '기초 설문조사 제출하기'}
              </AppButton>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0
          }}>
            © Szupia, Inc. 2019
          </p>
        </div>
      </div>
    );
  }

  // Results view
  const q1 = 1;
  const choice1 = answers[q1];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <SurveyHeader
        onLogoClick={() => navigate('/dashboard')}
        onLogout={logout}
      />

      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <AppLayout maxWidth={700}>
          <AppSection>
            <div style={{ padding: '32px' }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <span style={{ fontSize: '24px', color: 'white' }}>✓</span>
                </div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  기초 설문조사 완료
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  소중한 의견 감사합니다!
                </p>
              </div>

              <div style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px'
                }}>
                  결과 예시: 업무로 인한 피로감
                </h2>
                
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px'
                }}>
                  당신의 선택: <strong style={{ color: '#111827' }}>
                    {choice1}. {QUESTIONS[0].options[choice1]}
                  </strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(QUESTIONS[0].options).map(([opt, label]) => (
                    <div
                      key={opt}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: opt === choice1 ? '#3b82f6' : '#ffffff',
                        color: opt === choice1 ? '#ffffff' : '#374151',
                        border: '1px solid #e5e7eb',
                        fontWeight: opt === choice1 ? '600' : '400'
                      }}
                    >
                      <span>
                        <strong>{opt}.</strong> {label}
                      </span>
                      <span style={{
                        fontWeight: '600',
                        backgroundColor: opt === choice1 ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                        color: opt === choice1 ? '#ffffff' : '#374151',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {COMPANY_STATS[opt]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '24px',
                backgroundColor: '#f0f9ff',
                borderRadius: '12px',
                border: '1px solid #7dd3fc'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#0369a1',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  기초 설문조사가 완료되었습니다.<br />
                  이제 정신건강 체크를 시작해보세요!
                </p>
                
                <AppButton
                  variant="primary"
                  onClick={() => navigate('/questions')}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    padding: '12px 24px'
                  }}
                >
                  정신건강 체크 시작하기
                </AppButton>
              </div>
            </div>
          </AppSection>
        </AppLayout>

        {/* Footer */}
        <div style={{
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0
          }}>
            © Szupia, Inc. 2019
          </p>
        </div>
      </div>
    </div>
  );
}