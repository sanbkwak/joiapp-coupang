import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { getDocs, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLoginOrRegister } from './utils/useLoginOrRegister.js';
import AppLayout, { 
  AppSection, 
  AppButton 
} from './components/layout/AppLayout';
import JoiAppLogo from './joiapplogo.png'; 

const LandingPage = () => {
  const navigate = useNavigate();
  const handleLoginOrRegister = useLoginOrRegister();

  useEffect(() => {
    const fetchFirestoreData = async () => {
      try {
        const myCollection = collection(db, "users");
        const snapshot = await getDocs(myCollection);
        snapshot.docs.forEach(doc => console.log(doc.data()));
      } catch (error) {
        console.error('Error fetching documents: ', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchFirestoreData();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}>
            <img 
              src={JoiAppLogo} 
              alt="JoiApp Logo" 
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'white',
            margin: 0
          }}>
            JoiApp
          </h1>
        </div>
        
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)'
          }}
        >
          Admin
        </button>
      </header>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <AppLayout maxWidth={480}>
          <AppSection>
            <div style={{ padding: '48px 32px' }}>
              {/* Hero Section */}
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  padding: '8px'
                }}>
                  <img 
                    src={JoiAppLogo} 
                    alt="JoiApp Logo" 
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 16px 0',
                  lineHeight: '1.2'
                }}>
                  당신의 정신건강을 위한
                </h1>
                
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 24px 0'
                }}>
                  JoiApp
                </h2>
                
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  마음의 건강을 체크하고 관리하는<br />
                  스마트한 정신건강 도우미
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <AppButton
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '18px',
                    padding: '16px 24px'
                  }}
                >
                  로그인
                </AppButton>
                
                <AppButton
                  variant="outline"
                  fullWidth
                  onClick={() => navigate('/register')}
                  style={{
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontSize: '16px',
                    padding: '14px 24px'
                  }}
                >
                  회원가입
                </AppButton>
              </div>

              {/* Features */}
              <div style={{
                padding: '24px 0',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#ddd6fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px auto'
                    }}>
                      <span style={{ fontSize: '20px' }}>🧠</span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#374151',
                      fontWeight: '500',
                      margin: 0
                    }}>
                      정신건강 체크
                    </p>
                  </div>
                  
                  <div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#bfdbfe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px auto'
                    }}>
                      <span style={{ fontSize: '20px' }}>📊</span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#374151',
                      fontWeight: '500',
                      margin: 0
                    }}>
                      진단 결과
                    </p>
                  </div>
                  
                  <div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px auto'
                    }}>
                      <span style={{ fontSize: '20px' }}>💪</span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#374151',
                      fontWeight: '500',
                      margin: 0
                    }}>
                      건강 관리
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AppSection>
        </AppLayout>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0
        }}>
          © Szupia, Inc. 2019
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;