import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import { db, auth } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import JoiAppLogo from './joiapplogo.png';
import AppLayout, { AppSection, AppButton } from './components/layout/AppLayout';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const logout = useLogout();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.error("User not authenticated");
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.error('User data not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <AppLayout title="Loading..." maxWidth={800}>
        <AppSection style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#6b7280' }}>
            Loading your dashboard...
          </div>
        </AppSection>
      </AppLayout>
    );
  }

  if (!userData) {
    return (
      <AppLayout title="Error" maxWidth={800}>
        <AppSection style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#dc2626', marginBottom: '20px' }}>
            Error: User data not available
          </div>
          <AppButton onClick={() => navigate('/')} variant="primary">
            Return to Login
          </AppButton>
        </AppSection>
      </AppLayout>
    );
  }

  // Check completion status
  const hasProfile = userData.profileCompleted;
  const hasConsents = userData.consents && Object.keys(userData.consents).length > 0;
  const hasAssessments = userData.assessmentsCompleted > 0;

  const ActionCard = ({ 
    title, 
    description, 
    route, 
    icon, 
    status, 
    color = 'blue',
    completed = false 
  }) => (
    <div
      onClick={() => navigate(route)}
      style={{
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '2px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        ':hover': {
          borderColor: '#3b82f6',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = '#e5e7eb';
        e.target.style.boxShadow = 'none';
      }}
    >
      {completed && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '24px',
          height: '24px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
        </div>
      )}
      
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${getColorConfig(color).bg}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        margin: '0 0 12px 0',
        flex: 1,
        lineHeight: '1.5'
      }}>
        {description}
      </p>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto'
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: getColorConfig(color).text,
          backgroundColor: getColorConfig(color).bg,
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {status}
        </span>
        <span style={{ color: '#9ca3af', fontSize: '18px' }}>→</span>
      </div>
    </div>
  );

  const getColorConfig = (color) => {
    const configs = {
      blue: { bg: '#dbeafe', text: '#1e40af' },
      green: { bg: '#dcfce7', text: '#166534' },
      orange: { bg: '#fed7aa', text: '#9a3412' },
      purple: { bg: '#e9d5ff', text: '#7c2d12' },
      pink: { bg: '#fce7f3', text: '#be185d' }
    };
    return configs[color] || configs.blue;
  };

  const QuickStat = ({ label, value, sublabel }) => (
    <div style={{
      textAlign: 'center',
      padding: '16px'
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
        {label}
      </div>
      {sublabel && (
        <div style={{
          fontSize: '10px',
          color: '#9ca3af',
          marginTop: '2px'
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      {/* Header */}
      <AppSection style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <img 
            src={JoiAppLogo} 
            alt="JoiApp Logo" 
            style={{
              height: '32px',
              width: '32px'
            }}
          />
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#111827'
          }}>
            JoiApp
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/personal')}
            style={{
              background: 'none',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: '6px',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Profile
          </button>
          <AppButton onClick={logout} variant="secondary" style={{ fontSize: '14px' }}>
            Log Out
          </AppButton>
        </div>
      </AppSection>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                안녕하세요, {userData.username}님!
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: 0
              }}>
                오늘도 정신건강 관리를 시작해보세요
              </p>
            </div>
            
            {/* Quick Stats */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <QuickStat 
                label="로그인 횟수" 
                value={userData.numberOfLogins || 0}
              />
              <div style={{ width: '1px', backgroundColor: '#e5e7eb' }} />
              <QuickStat 
                label="완료한 평가" 
                value={userData.assessmentsCompleted || 0}
              />
              <div style={{ width: '1px', backgroundColor: '#e5e7eb' }} />
              <QuickStat 
                label="조이코인" 
                value={userData.joiCoins || 0}
              />
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #bae6fd'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#0369a1'
              }}>
                진행 상황
              </span>
              <span style={{
                fontSize: '14px',
                color: '#0369a1'
              }}>
                {[hasProfile, hasConsents, hasAssessments].filter(Boolean).length}/3 완료
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#e0f2fe',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  width: `${([hasProfile, hasConsents, hasAssessments].filter(Boolean).length / 3) * 100}%`,
                  height: '100%',
                  backgroundColor: '#0ea5e9',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <ActionCard
            title="프로필 설정"
            description="기본 정보를 입력하고 개인화된 경험을 시작하세요"
            route="/profile"
            icon="👤"
            status={hasProfile ? "완료됨" : "설정 필요"}
            color={hasProfile ? "green" : "orange"}
            completed={hasProfile}
          />

          <ActionCard
            title="권한 및 동의"
            description="개인정보 처리 동의 및 앱 권한을 관리하세요"
            route="/settings"
            icon="🔒"
            status={hasConsents ? "설정됨" : "설정 필요"}
            color={hasConsents ? "green" : "orange"}
            completed={hasConsents}
          />

          <ActionCard
            title="정신건강 평가"
            description="PHQ-2, GAD-2 설문을 통해 현재 상태를 확인하세요"
            route="/questions"
            icon="📋"
            status={hasAssessments ? `${userData.assessmentsCompleted}회 완료` : "시작하기"}
            color={hasAssessments ? "green" : "blue"}
            completed={hasAssessments}
          />

 

          <ActionCard
            title="결과 보기"
            description="지금까지의 평가 결과와 인사이트를 확인하세요"
            route="/results"
            icon="📊"
            status="확인하기"
            color="blue"
          />
        </div>

        {/* Quick Links */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            빠른 링크
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <Link
              to="/personal"
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#374151',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>개인 설정</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>→</span>
              </div>
            </Link>

            <Link
              to="/wallet"
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#374151',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>지갑 관리</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>→</span>
              </div>
            </Link>

            <Link
              to="/admin"
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#374151',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>관리자</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '24px',
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
};

export default DashboardPage;