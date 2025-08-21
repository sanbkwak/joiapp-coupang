import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import AppLayout, { 
  AppSection, 
  AppFormGroup, 
  AppInput, 
  AppButton, 
  AppStatusMessage 
} from './components/layout/AppLayout';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const navigate = useNavigate();
  const API_URL = "https://api.joiapp.org";
  
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // User login
const handleUserLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // First, authenticate with your Flask API
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = '로그인 실패: ';
      
      // Map your Flask API error codes to user-friendly messages
      switch (errorData.error?.code) {
        case 'INVALID_CREDENTIALS':
          errorMessage += '이메일 또는 비밀번호가 올바르지 않습니다.';
          break;
        case 'USER_NOT_FOUND':
          errorMessage += '존재하지 않는 계정입니다.';
          break;
        case 'INVALID_EMAIL':
          errorMessage += '올바르지 않은 이메일 형식입니다.';
          break;
        default:
          errorMessage += errorData.error?.message || 'Login failed';
      }
      showError(errorMessage);
      return;
    }

    const loginData = await response.json();
    
    // Store JWT token and user ID
    localStorage.setItem('jwt_token', loginData.token);
    localStorage.setItem('user_id', loginData.user_id);

    // Now handle the Firestore user data updates
    const uid = loginData.user_id;
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const data = snap.data() || {};

    const newLogins = (data.numberOfLogins || 0) + 1;
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
      numberOfLogins: newLogins,
      JoiPoints: newLogins * 5,
    });

    // Survey logic - every first login or every 2 weeks
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    const lastSurvey = data.lastSurveyDate?.toDate?.();
    const now = Date.now();
    const needSurvey = (
      data.numberOfLogins === 0 ||
      !lastSurvey ||
      now - lastSurvey.getTime() > TWO_WEEKS
    );

    navigate(needSurvey ? '/survey' : '/questions');

  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = '로그인 실패: ';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage += '네트워크 연결을 확인해주세요.';
    } else if (error.message.includes('rate limit')) {
      errorMessage += '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    } else {
      errorMessage += error.message;
    }
    showError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Admin login
const handleAdminLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // Use your Flask API for admin authentication
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      showError('관리자 로그인 오류: 아이디 또는 비밀번호가 잘못되었습니다.');
      return;
    }

    const loginData = await response.json();
    
    // Check if user has admin role (you'll need to add this to your user data)
    const userRef = doc(db, 'users', loginData.user_id);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData || userData.role !== 'admin') {
      showError('관리자 권한이 없습니다.');
      return;
    }

    // Store JWT token and user ID
    localStorage.setItem('jwt_token', loginData.token);
    localStorage.setItem('user_id', loginData.user_id);
    localStorage.setItem('user_role', 'admin');

    navigate('/admin');

  } catch (error) {
    console.error('Admin login error:', error);
    showError('관리자 로그인 오류: 서버 연결 실패');
  } finally {
    setLoading(false);
  }
};

  return (
    <AppLayout 
      title={isAdminMode ? '관리자 로그인' : '로그인'}
      showBackButton={true}
      maxWidth={460}
    >
      {/* Admin Mode Toggle */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsAdminMode(!isAdminMode);
            setEmail('');
            setPassword('');
          }}
          style={{
            background: 'none',
            border: '1px solid #d1d5db',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#9ca3af';
            e.target.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.color = '#6b7280';
          }}
        >
          {isAdminMode ? '← 사용자 로그인' : '관리자 로그인 →'}
        </button>
      </div>

      {error && (
        <AppStatusMessage 
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}

      <AppSection>
        <div style={{ padding: '32px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              {isAdminMode ? '관리자 계정으로 접속' : '다시 만나서 반가워요!'}
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              margin: 0
            }}>
              {isAdminMode ? '관리자 권한으로 시스템에 접속합니다' : '이메일과 비밀번호를 입력하세요'}
            </p>
          </div>

          <form
            onSubmit={isAdminMode ? handleAdminLogin : handleUserLogin}
          >
            <AppFormGroup label={isAdminMode ? '아이디' : '이메일'}>
              <AppInput
                type={isAdminMode ? 'text' : 'email'}
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdminMode ? '관리자 아이디를 입력하세요' : 'your@email.com'}
                required
              />
            </AppFormGroup>

            <AppFormGroup label="비밀번호">
              <AppInput
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </AppFormGroup>

            <div style={{ marginTop: '32px' }}>
              <AppButton
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
                style={{
                  background: isAdminMode 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                }}
              >
                {loading 
                  ? (isAdminMode ? '관리자 인증 중...' : '로그인 중...') 
                  : (isAdminMode ? '관리자 로그인' : '로그인')
                }
              </AppButton>
            </div>

            {!isAdminMode && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '24px',
                padding: '16px 0',
                borderTop: '1px solid #e5e7eb'
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: '0 0 8px 0'
                }}>
                  계정이 없으신가요?
                </p>
                <Link 
                  to="/register" 
                  style={{
                    fontSize: '16px',
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  회원가입
                </Link>
              </div>
            )}

            {isAdminMode && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#92400e',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  ⚠️ 관리자 모드입니다. 인증된 사용자만 접근할 수 있습니다.
                </p>
              </div>
            )}
          </form>
        </div>
      </AppSection>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: 0
        }}>
          © Szupia, Inc. 2019
        </p>
      </div>
    </AppLayout>
  );
};

export default LoginPage;