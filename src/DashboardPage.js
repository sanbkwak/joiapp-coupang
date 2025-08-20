import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import { db, auth } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import JoiAppLogo from './joiapplogo.png';

// Import AppLayout components
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
      <AppLayout title="Loading..." maxWidth={600}>
        <AppSection style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Loading your dashboard...
          </div>
        </AppSection>
      </AppLayout>
    );
  }

  if (!userData) {
    return (
      <AppLayout title="Error" maxWidth={600}>
        <AppSection style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{
            fontSize: '16px',
            color: '#dc2626',
            marginBottom: '20px'
          }}>
            Error: User data not available
          </div>
          <AppButton onClick={() => navigate('/')} variant="primary">
            Return to Login
          </AppButton>
        </AppSection>
      </AppLayout>
    );
  }

  return (
    <AppLayout maxWidth={600}>
      {/* Custom Header with Logo */}
      <AppSection style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer'
        }} onClick={() => navigate('/dashboard')}>
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
        
        <AppButton onClick={logout} variant="secondary">
          Log Out
        </AppButton>
      </AppSection>

      {/* Welcome Section */}
      <AppSection style={{ padding: '24px' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            Welcome back, {userData.username}!
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            User ID: {userId}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Login Stats */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              Total Logins
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827'
            }}>
              {userData.numberOfLogins}
            </div>
          </div>

          {/* Assessments */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #bae6fd'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#0369a1',
              marginBottom: '4px'
            }}>
              Assessments Completed
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#0c4a6e'
            }}>
              {userData.assessmentsCompleted || 0}
            </div>
          </div>

          {/* JoiCoins */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #fbbf24'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#92400e',
              marginBottom: '4px'
            }}>
              JoiCoins
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#78350f'
            }}>
              {userData.joiCoins || 0}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '12px'
          }}>
            Account Information
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <strong>Last Login:</strong> {userData.lastLogin ? userData.lastLogin.toDate().toLocaleString() : 'N/A'}
          </div>
        </div>
      </AppSection>

      {/* Footer */}
      <AppSection style={{
        padding: '16px 24px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: 0
        }}>
          © Szupia, Inc. 2019
        </p>
      </AppSection>
    </AppLayout>
  );
};

export default DashboardPage;