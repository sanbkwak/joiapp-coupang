// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import PrivacySettingsPage from './PrivacySettingsPage';
import { useNavigate } from 'react-router-dom';
import JoiAppLogo from './joiapplogo.png';
import { useLogout } from './utils/logout.js';
import { auth, db,  }          from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  setDoc,
  doc,
  getDoc,
  serverTimestamp

}      from 'firebase/firestore';

const LABEL_MAP = {
  camera: "카메라 접근 허용",
  microphone: "마이크 접근 허용",
  voiceRecording: "음성 녹음 허용",
  emotionAI: "감정 분석 AI 사용",
  surveySubmission: "설문 결과 제출",
};



 const SettingsPage = () => {
  const [userId, setUserId] = useState(null);
  const [consents, setConsents] = useState(null);
  const authInstance = auth();
  
  // ① Track authenticated user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ② When consents all loaded, save and move on
  const handleContinue = async () => {
    try {
      await setDoc(doc(db, 'users', userId, 'currentConsents'), {
        ...consents,
        updatedAt: serverTimestamp()
      });
      navigate('/survey');
    } catch (err) {
      console.error(err);
      alert('설정 저장 중 오류가 발생했습니다.');
    }
  };
  const navigate = useNavigate();

  return (
    <div className="settings-page" style={{ maxWidth: '720px', margin: '0 auto', padding: '40px' }}>
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo-container" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img src={JoiAppLogo} alt="JoiApp Logo" style={{ height: '40px', marginRight: '12px' }} />
          <h2 style={{ margin: 0 }}>설정</h2>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ background: '#eee', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          대시보드로 돌아가기
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
  {/* Pass callback to receive updated consents */}
  <PrivacySettingsPage onConsentsChange={setConsents} />
</div>

{/* ③ Show continue only when all types present */}
{consents && Object.keys(consents).length === Object.keys(LABEL_MAP).length && (
  <div style={{ textAlign: 'center', marginTop: '30px' }}>
    <button
      onClick={handleContinue}
      style={{
        padding: '12px 24px',
        background: '#2e86de',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      다음으로 이동
    </button>
  </div>
)}
    </div>
  );
};

export default SettingsPage;
