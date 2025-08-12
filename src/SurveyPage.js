import React, { useState } from 'react'
import { auth, db }          from './firebaseConfig';
import {
  collection,
  updateDoc,
  getDocs,
  addDoc,
  orderBy,
  doc,
  getDoc,
  serverTimestamp

}      from 'firebase/firestore';

import { useNavigate } from 'react-router-dom';
import JoiAppLogo from './joiapplogo.png'; 
import { useLogout } from './utils/logout.js';
import { Link } from 'react-router-dom';

// Company‐wide stats for every question
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
      A: "전혀 느끼지 않았다",
      B: "가끔(한두 번)",
      C: "때때로(주 1회 정도)",
      D: "자주(주 2~3회)",
      E: "항상(거의 매일)"
    }
  },
  {
    id: 2,
    text: "번아웃을 가장 크게 느끼게 하는 요인은 무엇입니까?",
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
    text: "성과 목표(KPI)를 달성해야 한다는 불안감을 얼마나 자주 느끼십니까?",
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
    text: "하루 중 디지털 커뮤니케이션(예: Slack, 이메일) 양 때문에 얼마나 압도감을 느끼십니까?",
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
      E: "항상 ‘ON’ 상태여서 벗어날 수 없다"
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
      B: "가끔 긴급 업무로 개인 시간을 희생한다",
      C: "일관되게 늦게까지 일하며 일부 시간 희생",
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
    text: "기밀 정신건강 지원(EAP, 상담 등)을 이용하는 데 얼마나 지원받고 있다고 느끼십니까?",
    options: {
      A: "매우 지원받음—쉽고 권장됨",
      B: "다소 지원받음—알지만 잘 사용 안 함",
      C: "중립—알긴 하지만 절차 불확실",
      D: "지원 미흡—도움이 없다고 느낌",
      E: "전혀 지원받지 못함"
    }
  }
]

export default function SurveyPage() {
  const [answers, setAnswers] = useState({})
  const [otherTexts, setOtherTexts] = useState({})
  const [submitted, setSubmitted] = useState(false)

   const navigate = useNavigate();
    const logout = useLogout();
  const handleChange = (qid, opt) => {
    setAnswers(a => ({ ...a, [qid]: opt }))
  }
  const handleOtherText = (qid, text) => {
    setOtherTexts(t => ({ ...t, [qid]: text }))
  }

const handleSubmit = async e => {
  e.preventDefault();

  if (Object.keys(answers).length !== QUESTIONS.length) {
    alert("모든 질문에 답변해 주세요.");
    return;
  }


    const payload = QUESTIONS.map(q => ({
      questionId: q.id,
      answer:     answers[q.id],
      freeText:
        q.allowFreeText && answers[q.id] === "E"
          ? (otherTexts[q.id] || "")
          : null
    }));

    try {
      // 1) add a new survey doc
      await addDoc(collection(db, "surveys"), {
        createdAt: serverTimestamp(),
        responses: payload
      });
      // 2) update this user's lastSurveyDate
      const uid = auth.currentUser.uid;
      await updateDoc(doc(db, "users", uid), {
        lastSurveyDate: serverTimestamp()
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Failed to save survey:", e);
      alert("제출에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  if (!submitted) {
    return (
      <div style={{ maxWidth:700, margin:"40px auto", padding:20 }}>
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div
    className="logo-container"
    onClick={() => navigate('/dashboard')}
    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
  >
    <img src={JoiAppLogo} alt="JoiApp Logo" style={{ height: '40px', marginRight: '12px' }} />
    <span className="app-name" style={{ fontSize: '20px', fontWeight: 'bold' }}>JoiApp</span>
  </div>

  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
  
    <button onClick={logout} className="logout-button">로그아웃</button>
  </div>
</div>

        {/* 🛡️ 익명 보장 안내 */}
        <div style={{
          marginBottom:24, padding:12,
          background: '#282c34d', borderRadius:6
        }}>
          <strong>🛡️ 익명 보장 안내</strong>
          <p style={{ margin:'8px 0 0' }}>
            이 설문조사는 완전한 익명으로 진행됩니다. 여러분의 응답은 개인 식별 정보와 전혀 연결되지 않으며, 안전하게 보호됩니다.
          </p>
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>직원 설문조사</h1>

        <form onSubmit={handleSubmit}>
          {QUESTIONS.map(q => (
            <fieldset key={q.id}   
                  style={{
                  marginBottom: '32px',
                  padding: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  backgroundColor: 'transparent'
                }}>
              <legend style={{
                        fontWeight: 600,
                        fontSize: '17px',
                        marginBottom: '12px'
                      }}>
                {q.id}. {q.text}
              </legend>

              {Object.entries(q.options).map(([opt,label])=>(
                <label key={opt}   style={{
                        display: 'block',
                        margin: '12px 0',
                        fontSize: '16px',
                        lineHeight: '1.6'
                      }}>
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={()=>handleChange(q.id,opt)}
                    required
                  />{" "}
                  <strong>{opt}.</strong> {label}
                </label>
              ))}

              {q.allowFreeText && answers[q.id]==='E' && (
                <textarea
                  placeholder="직접 입력"
                  value={otherTexts[q.id]||''}
                  onChange={e=>handleOtherText(q.id,e.target.value)}
                  style={{
                      width: '100%',
                      marginTop: 12,
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '15px',
                      lineHeight: '1.4'
                    }}
                />
              )}
            </fieldset>
          ))}
          <button
            type="submit"
            style={{
              display:'block', margin:'24px auto',
              padding:'12px 24px', background:'#283593',
              color:'#fff', border:'none', borderRadius:6,
              cursor:'pointer'
            }}
          >제출하기</button>
        </form>
      </div>
    )
  }

  // After submit, show stats
  const q1 = 1
  const choice1 = answers[q1]
  return (
    
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div
    className="logo-container"
    onClick={() => navigate('/dashboard')}
    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
  >
    <img src={JoiAppLogo} alt="JoiApp Logo" style={{ height: '40px', marginRight: '12px' }} />
    <span className="app-name" style={{ fontSize: '20px', fontWeight: 'bold' }}>JoiApp</span>
  </div>

  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
    <Link to="/settings" style={{ fontSize: '16px', textDecoration: 'none', color: '#333' }}>
      설정
    </Link>
    <button onClick={logout} className="logout-button">로그아웃</button>
  </div>
</div>

      <h1 style={{ textAlign: 'center' }}>통계 보기</h1>
      <h2>1. 업무로 인해 지쳤다고 느낀 빈도 (예시)</h2>
      <p>당신의 선택: <strong>{choice1}. {QUESTIONS[0].options[choice1]}</strong></p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.entries(QUESTIONS[0].options).map(([opt,label]) => (
          <li key={opt} style={{
            background: opt===choice1 ? '#283593':'#eee',
            color: opt===choice1 ? '#fff' :'#333',
            padding: '8px 12px',
            borderRadius: 4,
            margin: '4px 0',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span><strong>{opt}.</strong> {label}</span>
            <span>{COMPANY_STATS[opt]}%</span>
          </li>
        ))}
      </ul>
      <div style={{
        marginTop: 32,
        padding: 20,
        background: '#f9f9f9',
        border: '1px dashed #ccc',
        textAlign: 'center'
      }}>
      {/* ← HERE is where we navigate on button click */}
        <button
          onClick={() => navigate('/questions')}
          style={{
            background: '#283593',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          다음으로 이동
        </button>
      </div>

            <div className="footer">
        <p>© Szupia, Inc. 2019</p>
      </div>
    </div>
  )
}
