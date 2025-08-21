// src/pages/PrivacySettingsPage.js
import React, { useEffect, useState } from 'react';
import { auth, db } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { getAuthToken } from './utils/authUtility';
const LABEL_MAP = {
  camera: "카메라 접근 허용",
  microphone: "마이크 접근 허용",
  voiceRecording: "음성 녹음 허용",
  emotionAI: "감정 분석 AI 사용",
  surveySubmission: "설문 결과 제출",
};

const PrivacySettingsPage = ({ onConsentsChange }) => {
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

  // Notify parent component when consents change
  useEffect(() => {
    if (onConsentsChange) {
      onConsentsChange(consents);
    }
  }, [consents, onConsentsChange]);

  useEffect(() => {
    if (!userId) return;
    const fetchLogs = async () => {
      try {
        const snapshot = await getDocs(query(
          collection(db, 'users', userId, 'consents'),
          orderBy('timestamp', 'desc')
        ));
        const data = snapshot.docs.map(doc => doc.data());
        setConsentHistory(data);
      } catch (error) {
        console.error('Error fetching consent history:', error);
      }
    };
    fetchLogs();
  }, [userId]);

useEffect(() => {
  const token = getAuthToken();
  if (token) {
    const user_id = localStorage.getItem('user_id');
    setUserId(user_id);
    
    // Fetch existing consents
    if (user_id) {
      fetchUserConsents(user_id);
    }
  } else {
    navigate('/');
  }
}, [navigate]);
const fetchUserConsents = async (uid) => {
  try {
    const q = query(collection(db, 'users', uid, 'consents'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const latest = {};
    snapshot.forEach(doc => {
      const { type, granted } = doc.data();
      if (!(type in latest)) latest[type] = granted;
    });
    setConsents(prev => ({ ...prev, ...latest }));
  } catch (error) {
    console.error('Error fetching user consents:', error);
  }
};
  const toggleConsent = async (type) => {
    const newValue = !consents[type];
    const newConsents = { ...consents, [type]: newValue };
    setConsents(newConsents);
    
    if (userId) {
      try {
        await addDoc(collection(db, 'users', userId, 'consents'), {
          type,
          granted: newValue,
          timestamp: new Date(),
          context: 'manual toggle on PrivacySettingsPage'
        });
      } catch (error) {
        console.error('Error saving consent:', error);
      }
    }
  };

  return (
    <div style={{ color: '#111827' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          개인정보 및 동의 설정
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0,
          lineHeight: '1.5'
        }}>
          각 권한을 검토하고 동의 여부를 선택해주세요
        </p>
      </div>

      {/* Consent Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {Object.entries(consents).map(([type, granted]) => (
          <div
            key={type}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: granted ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.15s ease'
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                flex: 1,
                fontSize: '15px',
                fontWeight: '500',
                color: '#111827'
              }}
            >
              <input
                type="checkbox"
                checked={granted}
                onChange={() => toggleConsent(type)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#10b981',
                  cursor: 'pointer'
                }}
              />
              <span>{LABEL_MAP[type]}</span>
            </label>

            <div style={{ marginLeft: '12px' }}>
              {granted ? (
                <span style={{
                  fontSize: '12px',
                  color: '#059669',
                  backgroundColor: '#d1fae5',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  허용됨
                </span>
              ) : (
                <span style={{
                  fontSize: '12px',
                  color: '#dc2626',
                  backgroundColor: '#fee2e2',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  사용 안함
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Consent History */}
      {consentHistory.length > 0 && (
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            최근 동의 변경 기록
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {consentHistory.slice(0, 5).map((entry, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  fontSize: '13px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div>
                  <strong style={{ color: '#111827' }}>
                    {LABEL_MAP[entry.type] || entry.type}
                  </strong>
                  <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                    → {entry.granted ? '허용' : '거부'}
                  </span>
                </div>
                <span style={{
                  color: '#9ca3af',
                  fontSize: '12px'
                }}>
                  {entry.timestamp?.toDate ? 
                    new Date(entry.timestamp.toDate()).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 
                    '시간 정보 없음'
                  }
                </span>
              </div>
            ))}
          </div>
          
          {consentHistory.length === 0 && (
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              textAlign: 'center',
              margin: 0,
              fontStyle: 'italic'
            }}>
              아직 변경 기록이 없습니다
            </p>
          )}
        </div>
      )}

      {/* Information Notice */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>ℹ️</span>
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e40af',
              margin: '0 0 4px 0'
            }}>
              개인정보 보호 안내
            </h4>
            <p style={{
              fontSize: '13px',
              color: '#1e40af',
              margin: 0,
              lineHeight: '1.4'
            }}>
              모든 데이터는 암호화되어 안전하게 저장됩니다. 권한을 거부하셔도 
              기본 기능은 정상적으로 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;