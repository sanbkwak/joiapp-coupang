// src/pages/ProfilePage.js
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from './firebaseConfig'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/locale'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import AppLayout, { 
  AppSection, 
  AppFormGroup, 
  AppInput, 
  AppButton, 
  AppStatusMessage 
} from './components/layout/AppLayout'
import JoiAppLogo from './joiapplogo.png'
import { useLogout } from './utils/logout.js'

registerLocale('ko', ko)

// Header Component for consistency
const ProfileHeader = ({ onLogoClick, onLogout }) => (
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
        JoiApp
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
)

// Custom DatePicker Wrapper
const DatePickerWrapper = ({ value, onChange, placeholder, error }) => (
  <div style={{ position: 'relative' }}>
    <ReactDatePicker
      selected={value ? new Date(value) : null}
      onChange={(date) => onChange(date ? date.toISOString().split('T')[0] : '')}
      dateFormat="yyyy-MM-dd"
      locale="ko"
      placeholderText={placeholder}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      maxDate={new Date()}
      yearDropdownItemNumber={50}
      scrollableYearDropdown
      style={{
        width: '100%',
        padding: '12px 16px',
        border: `2px solid ${error ? '#dc2626' : '#d1d5db'}`,
        borderRadius: '8px',
        fontSize: '16px',
        outline: 'none',
        boxSizing: 'border-box'
      }}
      wrapperStyle={{ width: '100%' }}
      customInput={
        <input
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `2px solid ${error ? '#dc2626' : '#d1d5db'}`,
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.15s ease-in-out',
            backgroundColor: 'white',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = '#2563eb';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = '#d1d5db';
            }
          }}
        />
      }
    />
  </div>
)

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    gender: '',
    birthday: '',
    hireYear: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState('info')
  
  const navigate = useNavigate()
  const logout = useLogout()
  const uid = auth.currentUser?.uid

  const showStatus = (message, type = 'info') => {
    setStatusMessage(message)
    setStatusType(type)
    setTimeout(() => setStatusMessage(''), 5000)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.'
    }
    
    if (!formData.birthday) {
      newErrors.birthday = '생년월일을 입력해주세요.'
    } else {
      const birthDate = new Date(formData.birthday)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (birthDate > today) {
        newErrors.birthday = '생년월일이 미래일 수 없습니다.'
      } else if (age < 10 || age > 100) {
        newErrors.birthday = '생년월일이 올바르지 않습니다. (10세 이상 100세 이하)'
      }
    }
    
    if (!formData.hireYear) {
      newErrors.hireYear = '입사연도를 입력해주세요.'
    } else {
      const currentYear = new Date().getFullYear()
      const hireYear = Number(formData.hireYear)
      
      if (hireYear < 2000 || hireYear > currentYear) {
        newErrors.hireYear = `입사연도는 2000년부터 ${currentYear}년까지 가능합니다.`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showStatus('입력 정보를 확인해주세요.', 'error')
      return
    }

    setLoading(true)
    
    try {
      await updateDoc(doc(db, 'users', uid), {
        gender: formData.gender,
        birthday: new Date(formData.birthday),
        hireYear: Number(formData.hireYear),
        profileCompleted: true,
        profileUpdatedAt: serverTimestamp()
      })
      
      showStatus('프로필이 성공적으로 저장되었습니다!', 'success')
      
      // Navigate to settings after a short delay
      setTimeout(() => {
        navigate('/settings')
      }, 1500)
      
    } catch (e) {
      console.error('Profile save error:', e)
      showStatus('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <ProfileHeader
        onLogoClick={() => navigate('/dashboard')}
        onLogout={logout}
      />

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <AppLayout maxWidth={600}>
          {statusMessage && (
            <AppStatusMessage 
              message={statusMessage}
              type={statusType}
              onClose={() => setStatusMessage('')}
            />
          )}

          <AppSection>
            <div style={{ padding: '32px' }}>
              {/* Header Section */}
              <div style={{
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <span style={{ fontSize: '32px' }}>🎉</span>
                </div>
                
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  프로필을 완성해주세요
                </h1>
                
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  간단한 정보를 입력하고 여정을 시작해요
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Gender Selection */}
                <AppFormGroup label="성별" error={errors.gender}>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${errors.gender ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: 'white',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease-in-out'
                    }}
                    onFocus={(e) => {
                      if (!errors.gender) {
                        e.target.style.borderColor = '#2563eb'
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.gender) {
                        e.target.style.borderColor = '#d1d5db'
                      }
                    }}
                  >
                    <option value="">선택하세요</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                    <option value="prefer_not">응답 거부</option>
                  </select>
                </AppFormGroup>

                {/* Birthday */}
                <AppFormGroup label="생년월일" error={errors.birthday}>
                  <DatePickerWrapper
                    value={formData.birthday}
                    onChange={(date) => handleChange('birthday', date)}
                    placeholder="생년월일을 선택하세요"
                    error={errors.birthday}
                  />
                </AppFormGroup>

                {/* Hire Year */}
                <AppFormGroup label="입사연도" error={errors.hireYear}>
                  <AppInput
                    type="number"
                    value={formData.hireYear}
                    onChange={(e) => handleChange('hireYear', e.target.value)}
                    placeholder="예: 2020"
                    min="2000"
                    max={new Date().getFullYear()}
                    error={errors.hireYear}
                  />
                </AppFormGroup>

                {/* Submit Button */}
                <div style={{ marginTop: '32px' }}>
                  <AppButton
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      padding: '16px 24px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? '저장 중...' : '저장하고 계속 →'}
                  </AppButton>
                </div>

                {/* Progress Indicator */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '16px' }}>📝</span>
                    <strong style={{ color: '#92400e' }}>
                      1단계: 프로필 작성
                    </strong>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: '#92400e',
                    margin: 0
                  }}>
                    다음: 권한 설정 → 설문조사 → 정신건강 체크
                  </p>
                </div>
              </form>
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
  )
}