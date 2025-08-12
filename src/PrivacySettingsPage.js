// src/pages/PrivacySettingsPage.js
import React, { useEffect, useState } from 'react';
import { auth, db } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
 
const LABEL_MAP = {
  camera: "카메라 접근 허용",
  microphone: "마이크 접근 허용",
  voiceRecording: "음성 녹음 허용",
  emotionAI: "감정 분석 AI 사용",
  surveySubmission: "설문 결과 제출",
};

const PrivacySettingsPage = () => {
  const [userId, setUserId] = useState(null);
  const [consents, setConsents] = useState({
    camera: false,
    microphone: false,
    emotionAI: false,
    voiceRecording: false,
    surveySubmission: true,
  });
  const navigate = useNavigate();
const [consentHistory, setConsentHistory] = useState([]);

useEffect(() => {
  if (!userId) return;
  const fetchLogs = async () => {
    const snapshot = await getDocs(query(
      collection(db, 'users', userId, 'consents'),
      orderBy('timestamp', 'desc')
    ));
    const data = snapshot.docs.map(doc => doc.data());
    setConsentHistory(data);
  };
  fetchLogs();
}, [userId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const q = query(collection(db, 'users', user.uid, 'consents'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const latest = {};
        snapshot.forEach(doc => {
          const { type, granted } = doc.data();
          if (!(type in latest)) latest[type] = granted;
        });
        setConsents(prev => ({ ...prev, ...latest }));
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const toggleConsent = async (type) => {
    const newValue = !consents[type];
    setConsents(prev => ({ ...prev, [type]: newValue }));
    if (userId) {
      await addDoc(collection(db, 'users', userId, 'consents'), {
        type,
        granted: newValue,
        timestamp: new Date(),
        context: 'manual toggle on PrivacySettingsPage'
      });
    }
  };

  return (
    <div className="privacy-settings-container">
 
 
      <h2>개인정보 및 동의 설정</h2>
      
      <ul>
        {Object.entries(consents).map(([type, granted]) => (
          <li key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>
                <input
                type="checkbox"
                checked={granted}
                onChange={() => toggleConsent(type)}
                />
                {LABEL_MAP[type]}
            </label>
            {!granted && (
                <span style={{
                fontSize: '12px',
                color: '#d32f2f',
                backgroundColor: '#ffeaea',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600
                }}>
                사용 안함
                </span>
            )}
        </li>

        ))}
        <h3 style={{ marginTop: '40px' }}>최근 동의 변경 기록</h3>
            <ul>
            {consentHistory.slice(0, 5).map((entry, index) => (
                <li key={index} style={{ fontSize: '14px' }}>
                <strong>{entry.type}</strong> → {entry.granted ? '허용' : '거부'} ({new Date(entry.timestamp.toDate()).toLocaleString()})
                </li>
            ))}
            </ul>
      </ul>
      
    </div>
  );
};

export default PrivacySettingsPage;
