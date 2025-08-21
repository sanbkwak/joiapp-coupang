import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { db } from './firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AppLayout, { 
  AppSection, 
  AppFormGroup, 
  AppInput, 
  AppButton, 
  AppStatusMessage 
} from './components/layout/AppLayout';
import { 
  validateRegistrationForm, 
  getPasswordStrength, 
  generateSupportId 
} from './utils/authValidation';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
     name: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const API_URL = "https://api.joiapp.org";
  const navigate = useNavigate();
 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const showStatus = (message, type = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => setStatusMessage(''), 8000);
  };

  const handleRegister = async (e) => {
  e.preventDefault();
  
  // Validate form
  const validationErrors = validateRegistrationForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    showStatus('입력 정보를 확인해주세요.', 'error');
    return;
  }

  setLoading(true);
  setErrors({});

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        name: formData.name // Extract name from email
      })
    });

 if (response.ok) {
  const data = await response.json();
  localStorage.setItem('jwt_token', data.token);
  localStorage.setItem('user_id', data.user_id);
  showStatus('가입이 완료되었습니다!', 'success');
  navigate('/survey');
} else {
      const errorData = await response.json();
      let errorMessage = '회원가입 실패: ';
      
      // Update to match Flask backend error structure
      switch (errorData.error?.code) {
        case 'EMAIL_ALREADY_EXISTS': // Changed from EMAIL_EXISTS
          errorMessage += '이미 사용 중인 이메일입니다.';
          setErrors({ email: '이미 사용 중인 이메일입니다.' });
          break;
        case 'WEAK_PASSWORD':
          errorMessage += '비밀번호가 너무 약합니다.';
          setErrors({ password: ['비밀번호가 보안 요구사항을 충족하지 않습니다.'] });
          break;
        case 'INVALID_EMAIL_FORMAT': // Changed from INVALID_EMAIL
          errorMessage += '올바르지 않은 이메일 형식입니다.';
          setErrors({ email: '올바르지 않은 이메일 형식입니다.' });
          break;
        default:
          errorMessage += errorData.error?.message || 'Registration failed';
      }
      showStatus(errorMessage, 'error');
    }
  }  catch (error) {
  console.error('Registration error:', error);
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    showStatus('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.', 'error');
  } else {
    showStatus('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'error');
  }
} finally {
  setLoading(false);
}
};

  const passwordStrength = getPasswordStrength(formData.password);

  if (showEmailVerification) {
    return (
      <AppLayout 
        title="이메일 인증"
        showBackButton={false}
        maxWidth={480}
      >
        <AppSection>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <span style={{ fontSize: '32px', color: 'white' }}>📧</span>
            </div>
            
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#111827',
              margin: '0 0 16px 0'
            }}>
              이메일 인증이 필요합니다
            </h2>
            
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              margin: '0 0 24px 0',
              lineHeight: '1.5'
            }}>
              <strong>{formData.email}</strong>로<br />
              인증 링크를 보내드렸습니다.
            </p>

            <div style={{
              padding: '20px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e40af',
                margin: '0 0 12px 0'
              }}>
                다음 단계:
              </h3>
              <ol style={{
                fontSize: '14px',
                color: '#1e40af',
                margin: 0,
                paddingLeft: '20px',
                textAlign: 'left'
              }}>
                <li>이메일함을 확인하세요</li>
                <li>인증 링크를 클릭하세요</li>
                <li>로그인 페이지로 돌아와 로그인하세요</li>
              </ol>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <AppButton
                variant="primary"
                onClick={() => navigate('/login')}
                fullWidth
              >
                로그인 페이지로 이동
              </AppButton>
              
              <AppButton
                variant="outline"
                onClick={() => setShowEmailVerification(false)}
                fullWidth
              >
                다시 가입하기
              </AppButton>
            </div>

            <div style={{
              marginTop: '24px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              ⚠️ 이메일이 보이지 않나요? 스팸 폴더를 확인해보세요.
            </div>
          </div>
        </AppSection>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="계정 생성"
      showBackButton={true}
      maxWidth={480}
    >
      {statusMessage && (
        <AppStatusMessage 
          message={statusMessage}
          type={statusType}
          onClose={() => setStatusMessage('')}
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
              환영합니다!
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              margin: 0
            }}>
              새로운 계정을 만들어 시작하세요
            </p>
          </div>
          <AppFormGroup label="이름" error={errors.name}>
            <AppInput
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              error={errors.name}
              required
            />
          </AppFormGroup>
          <form onSubmit={handleRegister}>
            <AppFormGroup label="이메일" error={errors.email}>
              <AppInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                error={errors.email}
                required
              />
            </AppFormGroup>

            <AppFormGroup label="비밀번호" error={errors.password}>
              <AppInput
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="안전한 비밀번호를 입력하세요"
                error={errors.password}
                required
              />
              
              {/* Password strength indicator */}
              {formData.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      flex: 1,
                      height: '4px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          height: '100%',
                          backgroundColor: passwordStrength.color,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: passwordStrength.color
                    }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  
                  {errors.password && (
                    <div style={{ fontSize: '12px', color: '#dc2626' }}>
                      <strong>요구사항:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                        {errors.password.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </AppFormGroup>

            <AppFormGroup label="비밀번호 확인" error={errors.confirmPassword}>
              <AppInput
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
                error={errors.confirmPassword}
                required
              />
            </AppFormGroup>

            <div style={{ marginTop: '32px' }}>
              <AppButton
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading || !passwordStrength.isValid}
              >
                {loading ? '계정 생성 중...' : '계정 생성'}
              </AppButton>
            </div>

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
                이미 계정이 있으신가요?
              </p>
              <Link 
                to="/login" 
                style={{
                  fontSize: '16px',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                로그인
              </Link>
            </div>
          </form>
        </div>
      </AppSection>
    </AppLayout>
  );
};

export default RegistrationPage;