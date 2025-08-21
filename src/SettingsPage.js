// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import PrivacySettingsPage from './PrivacySettingsPage';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  setDoc,
  doc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

import { getAuthToken } from './utils/authUtility';
import AppLayout, { 
  AppSection, 
  AppButton, 
  AppStatusMessage 
} from './components/layout/AppLayout';
import JoiAppLogo from './joiapplogo.png';
import { useLogout } from './utils/logout.js';

const LABEL_MAP = {
  camera: "카메라 접근 허용",
  microphone: "마이크 접근 허용",
  voiceRecording: "음성 녹음 허용",
  emotionAI: "감정 분석 AI 사용",
  surveySubmission: "설문 결과 제출",
};

// Header Component for consistency
const SettingsHeader = ({ onLogoClick, onBackClick, onLogout }) => (
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
        설정
      </span>
    </div>

    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    }}>
      <AppButton
        variant="outline"
        onClick={onBackClick}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          borderColor: '#d1d5db',
          color: '#6b7280'
        }}
      >
        ← 대시보드
      </AppButton>
      <AppButton
        variant="outline"
        onClick={onLogout}
        style={{
          padding: '8px 16px',
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

const SettingsPage = () => {
  const [userId, setUserId] = useState(null);
  const [consents, setConsents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const API_URL = 'https://api.joiapp.org';
  const navigate = useNavigate();
  const logout = useLogout();

  // Track authenticated user
useEffect(() => {
  const token = getAuthToken();
  const user_id = localStorage.getItem('user_id');
  
  if (token && user_id) {
    setUserId(user_id);
  } else {
    navigate('/login');
  }
}, [navigate]);

useEffect(() => {
  if (userId) {
    loadUserSettings();
  }
}, [userId]);




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

// Load user settings from backend
const loadUserSettings = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_URL}/api/v1/user/settings`);
    if (response && response.ok) {
      const data = await response.json();
      setConsents(data.consents || {});
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

// Save settings to backend
const handleSaveSettings = async () => {
  if (!userId || !consents) {
    setError('사용자 정보 또는 설정이 불완전합니다.');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await makeAuthenticatedRequest(`${API_URL}/api/v1/user/settings`, {
      method: 'PUT',
      body: JSON.stringify({
        consents: consents
      })
    });

    if (response && response.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (err) {
    console.error('Settings save error:', err);
    setError('설정 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
  } finally {
    setLoading(false);
  }
};


  // When consents all loaded, save and move on
  const handleContinue = async () => {
    if (!userId || !consents) {
      setError('사용자 정보 또는 설정이 불완전합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setDoc(doc(db, 'users', userId), {
        consents: {
          ...consents,
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      setSuccess(true);
      
      // Navigate after showing success message
      setTimeout(() => {
        navigate('/survey');
      }, 1500);

    } catch (err) {
      console.error('Settings save error:', err);
      setError('설정 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }; 

  const isAllConsentsSet = consents && Object.keys(consents).length === Object.keys(LABEL_MAP).length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <SettingsHeader
        onLogoClick={() => navigate('/dashboard')}
        onBackClick={() => navigate('/dashboard')}
        onLogout={logout}
      />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Status Messages */}
        {error && (
          <AppStatusMessage 
            message={error}
            type="error"
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <AppStatusMessage 
            message="설정이 성공적으로 저장되었습니다!"
            type="success"
            onClose={() => setSuccess(false)}
          />
        )}

        <AppLayout maxWidth={800}>
          <AppSection>
            <div style={{ padding: '32px' }}>
              {/* Header Section */}
              <div style={{
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                  </svg>
                </div>
                
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  개인정보 및 권한 설정
                </h1>
                
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  JoiApp의 기능을 사용하기 위한 권한을 설정해주세요
                </p>
              </div>

              {/* Privacy Settings Component */}
              <div style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <PrivacySettingsPage onConsentsChange={setConsents} />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center'
              }}>
                {/* Save Settings Button */}
                <AppButton
                  variant="outline"
                  onClick={handleSaveSettings}
                  disabled={loading || !isAllConsentsSet}
                  fullWidth
                  style={{
                    maxWidth: '300px',
                    borderColor: '#6366f1',
                    color: '#6366f1'
                  }}
                >
                  {loading ? '저장 중...' : '설정 저장'}
                </AppButton>

                {/* Continue Button */}
                {isAllConsentsSet && (
                  <AppButton
                    variant="primary"
                    onClick={handleContinue}
                    disabled={loading}
                    fullWidth
                    style={{
                      maxWidth: '300px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      padding: '14px 24px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? '진행 중...' : '다음으로 이동'}
                  </AppButton>
                )}
              </div>

              {/* Progress Indicator */}
              <div style={{
                marginTop: '32px',
                padding: '20px',
                backgroundColor: isAllConsentsSet ? '#f0fdf4' : '#fef3c7',
                borderRadius: '12px',
                border: `1px solid ${isAllConsentsSet ? '#bbf7d0' : '#fbbf24'}`,
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '18px' }}>
                    {isAllConsentsSet ? '✅' : '⚠️'}
                  </span>
                  <strong style={{
                    color: isAllConsentsSet ? '#15803d' : '#92400e'
                  }}>
                    {isAllConsentsSet ? '설정 완료' : '설정 진행 중'}
                  </strong>
                </div>
                
                <p style={{
                  fontSize: '14px',
                  color: isAllConsentsSet ? '#15803d' : '#92400e',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {isAllConsentsSet 
                    ? '모든 권한 설정이 완료되었습니다. 설문조사를 시작할 수 있습니다.'
                    : `${Object.keys(consents || {}).length}/${Object.keys(LABEL_MAP).length}개 설정 완료. 모든 권한을 설정해주세요.`
                  }
                </p>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginTop: '12px'
                }}>
                  <div
                    style={{
                      width: `${((Object.keys(consents || {}).length / Object.keys(LABEL_MAP).length) * 100)}%`,
                      height: '100%',
                      backgroundColor: isAllConsentsSet ? '#10b981' : '#f59e0b',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              {/* Help Section */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e40af',
                  margin: '0 0 8px 0'
                }}>
                  💡 도움말
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#1e40af',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  권한 설정은 언제든지 변경할 수 있습니다. 개인정보는 안전하게 보호되며, 
                  설정한 권한 범위 내에서만 기능이 작동합니다.
                </p>
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
};

export default SettingsPage;