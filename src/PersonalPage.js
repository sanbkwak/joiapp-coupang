// src/components/PersonalPage.js
import React, { useState, useContext, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { WalletContext } from './contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { 
  getUserProfile,
  getUserConsents, 
  getUserSettings, 
  getUserDevicePermissions,
  updateUserConsent,
  updateUserSetting,
  updateDevicePermission,
  handleConsentWithdrawal,
  logUserActivity,
  initializeUserIfNeeded
} from './utils/userModel';

export default function PersonalPage({
  version = '1.0',
  build = '1',
  initialLanguage = 'English',
  onViewResults,
  onNotifications,
  onCameraMicrophone,
  onEditAccount,
  onOpenJDVM, // Joi Data Valuation Model
  onOpenPrivacy,
  onOpenTOS,
  onWithdrawConsentConfirm, // optional async confirm
}) {
  const { user, logout, loading: authLoading } = useAuth() || { user: null, logout: async () => {}, loading: true };
  const { publicKey, connect, isConnected, isInitialized } = useContext(WalletContext) || {};

  // State for user data
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [userConsents, setUserConsents] = useState({});
  const [userSettings, setUserSettings] = useState({});
  const [devicePermissions, setDevicePermissions] = useState({});
  
  // Get display name and email from Firebase user or fallback
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'No email provided';

  const [language, setLanguage] = useState(initialLanguage);
  const [dataUsageConsent, setDataUsageConsent] = useState(false);
  const [withdrawConsent, setWithdrawConsent] = useState(false);
  
  // Freighter wallet states
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  const navigate = useNavigate();

  // Fetch user data, consents, and settings from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setUserDataLoading(false);
        return;
      }

      try {
        // Ensure user exists in Firestore first
        await initializeUserIfNeeded(user.uid);

        // Fetch all user data in parallel
        const [profile, consents, settings, permissions] = await Promise.all([
          getUserProfile(user.uid).catch((err) => {
            console.error('Error fetching profile:', err);
            return null;
          }),
          getUserConsents(user.uid).catch((err) => {
            console.error('Error fetching consents:', err);
            return {};
          }),
          getUserSettings(user.uid).catch((err) => {
            console.error('Error fetching settings:', err);
            return {};
          }),
          getUserDevicePermissions(user.uid).catch((err) => {
            console.error('Error fetching permissions:', err);
            return {};
          })
        ]);
        
        // Set user profile data
        if (profile) {
          setUserData(profile);
          console.log('User data loaded:', profile);
        }

        // Set consents state
        setUserConsents(consents);
        setDataUsageConsent(consents.dataUsage?.granted || false);
        setWithdrawConsent(consents.withdrawConsent?.granted || false);

        // Set settings state
        setUserSettings(settings);
        setLanguage(settings.language || initialLanguage);

        // Set device permissions state
        setDevicePermissions(permissions);

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, [user?.uid, initialLanguage]);

  // Show loading state while auth is initializing
  if (authLoading || userDataLoading) {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Loading your profile...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <div style={styles.notAuthenticatedContainer}>
            <h2 style={styles.notAuthenticatedTitle}>Please Log In</h2>
            <p style={styles.notAuthenticatedText}>
              You need to be logged in to view your personal profile.
            </p>
            <button
              style={styles.loginButton}
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Simple chevron
  const Chevron = () => <span style={styles.chevron}>›</span>;

  const handleFreighterConnect = async () => {
    if (!connect) {
      setConnectionStatus('⌐ WalletContext not available');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('🔄 Connecting to Freighter wallet...');
    
    try {
      await connect();
      setConnectionStatus('✅ Connected successfully!');
      
      // Log wallet connection
      await logUserActivity(user.uid, 'wallet_connected', { publicKey });
    } catch (err) {
      console.error('Connection error:', err);
      
      let errorMessage = 'Connection failed';
      if (err.message.includes('User declined access') || err.message.includes('User denied access')) {
        errorMessage = '⌐ Connection denied by user';
      } else if (err.message.includes('not found') || err.message.includes('not detected')) {
        errorMessage = '⌐ Freighter wallet not found. Please install the Freighter extension from freighter.app';
      } else if (err.message.includes('not available')) {
        errorMessage = '⌐ Freighter API not available. Please update your extension or try refreshing the page.';
      } else {
        errorMessage = `⌐ Error: ${err.message}`;
      }
      
      setConnectionStatus(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWithdrawToggle = async (next) => {
    if (typeof onWithdrawConsentConfirm === 'function') {
      const ok = await onWithdrawConsentConfirm(next);
      if (!ok) return;
    }
    
    try {
      if (next) {
        // Handle full consent withdrawal
        await handleConsentWithdrawal(user.uid);
        setWithdrawConsent(true);
        setDataUsageConsent(false); // Automatically revoke data usage when withdrawing
        
        // Update local state
        setUserConsents(prev => ({
          ...prev,
          withdrawConsent: { granted: true, timestamp: new Date() },
          dataUsage: { granted: false, timestamp: new Date() }
        }));
        
        alert('All consents have been withdrawn successfully.');
      } else {
        // Just update the withdraw consent flag
        await updateUserConsent(user.uid, 'withdrawConsent', false);
        setWithdrawConsent(false);
        
        setUserConsents(prev => ({
          ...prev,
          withdrawConsent: { granted: false, timestamp: new Date() }
        }));
      }
    } catch (error) {
      console.error('Error updating consent:', error);
      alert('Failed to update consent. Please try again.');
      // Revert the state on error
      setWithdrawConsent(!next);
    }
  };

  const handleDataUsageToggle = async (granted) => {
    try {
      await updateUserConsent(user.uid, 'dataUsage', granted);
      setDataUsageConsent(granted);
      
      setUserConsents(prev => ({
        ...prev,
        dataUsage: { granted, timestamp: new Date() }
      }));
      
      // Log the activity
      await logUserActivity(user.uid, 'data_usage_consent_changed', { granted });
      
      // Show success message
      const message = granted ? 'Data usage consent granted' : 'Data usage consent revoked';
      setConnectionStatus(`✅ ${message}`);
      setTimeout(() => setConnectionStatus(''), 3000);
      
    } catch (error) {
      console.error('Error updating data usage consent:', error);
      alert('Failed to update consent. Please try again.');
      // Revert the state on error
      setDataUsageConsent(!granted);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    try {
      await updateUserSetting(user.uid, 'language', newLanguage);
      setLanguage(newLanguage);
      
      setUserSettings(prev => ({
        ...prev,
        language: newLanguage
      }));
      
      // Log the activity
      await logUserActivity(user.uid, 'language_changed', { language: newLanguage });
      
      // Show success message
      setConnectionStatus(`✅ Language changed to ${newLanguage}`);
      setTimeout(() => setConnectionStatus(''), 3000);
      
    } catch (error) {
      console.error('Error updating language:', error);
      alert('Failed to update language. Please try again.');
      // Revert the state on error
      setLanguage(language);
    }
  };

  const handleNotificationsClick = async () => {
    if (onNotifications) {
      onNotifications();
    } else {
      try {
        // Toggle email notifications
        const currentEmailSetting = userSettings.notifications?.email || false;
        await updateUserSetting(user.uid, 'notifications.email', !currentEmailSetting);
        
        setUserSettings(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            email: !currentEmailSetting
          }
        }));
        
        const message = !currentEmailSetting ? 'Email notifications enabled' : 'Email notifications disabled';
        setConnectionStatus(`✅ ${message}`);
        setTimeout(() => setConnectionStatus(''), 3000);
        
      } catch (error) {
        console.error('Error updating notifications:', error);
        alert('Failed to update notification settings. Please try again.');
      }
    }
  };

  const handleCameraMicrophoneClick = async () => {
    if (onCameraMicrophone) {
      onCameraMicrophone();
    } else {
      try {
        // Check if browser supports permissions API
        if ('permissions' in navigator) {
          // Request camera and microphone permissions
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          const micPermission = await navigator.permissions.query({ name: 'microphone' });
          
          await updateDevicePermission(user.uid, 'camera', cameraPermission.state === 'granted');
          await updateDevicePermission(user.uid, 'microphone', micPermission.state === 'granted');
          
          // Refresh device permissions
          const updatedPermissions = await getUserDevicePermissions(user.uid);
          setDevicePermissions(updatedPermissions);
          
          setConnectionStatus('✅ Device permissions updated');
          setTimeout(() => setConnectionStatus(''), 3000);
        } else {
          // Fallback for browsers without permissions API
          setConnectionStatus('ℹ️ Please check your browser settings for camera and microphone permissions');
          setTimeout(() => setConnectionStatus(''), 3000);
        }
        
      } catch (error) {
        console.error('Error checking device permissions:', error);
        setConnectionStatus('⚠️ Unable to check device permissions. Please check your browser settings.');
        setTimeout(() => setConnectionStatus(''), 3000);
      }
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const navigateToTrustline = () => {
    navigate('/wallet/trustline');
  };

  const handleLogout = async () => {
    try {
      await logUserActivity(user.uid, 'user_logout', {});
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      navigate('/login');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    
    try {
      // Handle Firestore timestamp or regular Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div style={styles.headerTitle}>Personal</div>
          <div style={styles.versionTop}>Version {version}</div>
        </div>

        {/* SECTION: Account */}
        <SectionTitle>Account</SectionTitle>

        <Row>
          <div style={{ flex: 1 }}>
            <div style={styles.primaryText}>{displayName}</div>
            <div style={styles.secondaryText}>{email}</div>
            {userData && (
              <div style={styles.tertiaryText}>
                Login Count: {userData.numberOfLogins || 0} | 
                Joi Points: {userData.JoiPoints || 0}
              </div>
            )}
          </div>
          <button
            style={styles.linkButton}
            onClick={onEditAccount}
            aria-label="Edit Account"
          >
            Edit
          </button>
        </Row>

        <RowButton onClick={onViewResults} ariaLabel="View Survey Results">
          <span>View Survey Results</span>
          <Chevron />
        </RowButton>

        {/* SECTION: Stellar Wallet */}
        <SectionTitle>Stellar Wallet</SectionTitle>

        {!isInitialized ? (
          <Row>
            <span>🔄 Checking wallet connection...</span>
          </Row>
        ) : !isConnected ? (
          <>
            <RowButton 
              onClick={handleFreighterConnect} 
              ariaLabel="Connect Freighter Wallet"
              disabled={isConnecting}
            >
              <span>{isConnecting ? 'Connecting...' : 'Connect Freighter Wallet'}</span>
              <Chevron />
            </RowButton>
            
            <div style={styles.helpText}>
              Don't have Freighter?{' '}
              <a 
                href="https://www.freighter.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.helpLink}
              >
                Install it here
              </a>
            </div>
          </>
        ) : (
          <>
            <Row>
              <div style={{ flex: 1 }}>
                <div style={styles.primaryText}>Freighter Wallet</div>
                <div style={styles.secondaryText}>{formatAddress(publicKey)}</div>
              </div>
              <div style={styles.statusBadge}>Connected</div>
            </Row>

            <RowButton onClick={navigateToTrustline} ariaLabel="Manage SZUP Trustline">
              <span>Manage SZUP Trustline</span>
              <Chevron />
            </RowButton>

            <RowButton 
              onClick={() => navigate('/wallet/transfer')} 
              ariaLabel="Transfer SZUP"
            >
              <span>Transfer SZUP</span>
              <Chevron />
            </RowButton>
          </>
        )}

        {/* Status message */}
        {connectionStatus && (
          <div style={styles.statusMessage}>
            {connectionStatus}
          </div>
        )}

        {/* SECTION: Settings */}
        <SectionTitle>Settings</SectionTitle>

        <RowButton
          onClick={() => {
            const next = window.prompt('Select Language:\n1. English\n2. Spanish\n3. French\n4. German\n5. Chinese\n\nEnter your choice (1-5) or type custom language:', '1');
            
            if (next) {
              let newLanguage;
              switch(next) {
                case '1': newLanguage = 'English'; break;
                case '2': newLanguage = 'Spanish'; break;
                case '3': newLanguage = 'French'; break;
                case '4': newLanguage = 'German'; break;
                case '5': newLanguage = 'Chinese'; break;
                default: newLanguage = next; break;
              }
              
              if (newLanguage && newLanguage !== language) {
                handleLanguageChange(newLanguage);
              }
            }
          }}
          ariaLabel="Language"
        >
          <span>Language</span>
          <span style={styles.valueText}>{language}</span>
        </RowButton>

        <RowButton onClick={handleNotificationsClick} ariaLabel="Notifications">
          <span>Notifications</span>
          <span style={styles.valueText}>
            {userSettings.notifications?.email ? '✓' : '○'}
          </span>
          <Chevron />
        </RowButton>

        <RowButton onClick={handleCameraMicrophoneClick} ariaLabel="Camera & Microphone">
          <span>Camera & Microphone</span>
          <span style={styles.valueText}>
            {devicePermissions.camera?.granted && devicePermissions.microphone?.granted ? '✓' : 
             devicePermissions.camera?.granted || devicePermissions.microphone?.granted ? '◐' : '○'}
          </span>
          <Chevron />
        </RowButton>

        {/* SECTION: Consents */}
        <SectionTitle>Consents</SectionTitle>

        <Row>
          <span>Data Usage</span>
          <input
            type="checkbox"
            checked={dataUsageConsent}
            onChange={(e) => handleDataUsageToggle(e.target.checked)}
            aria-label="Data Usage Consent"
            style={styles.checkbox}
          />
        </Row>

        <Row>
          <span>Withdraw Consent</span>
          <input
            type="checkbox"
            checked={withdrawConsent}
            onChange={(e) => handleWithdrawToggle(e.target.checked)}
            aria-label="Withdraw Consent"
            style={styles.checkbox}
          />
        </Row>

        {/* Display consent timestamps */}
        {(userConsents.dataUsage?.timestamp || userConsents.withdrawConsent?.timestamp) && (
          <div style={styles.consentInfo}>
            <div style={styles.consentTimestamp}>
              {userConsents.dataUsage?.timestamp && (
                <div>Data usage updated: {formatTimestamp(userConsents.dataUsage.timestamp)}</div>
              )}
              {userConsents.withdrawConsent?.timestamp && (
                <div>Consent status updated: {formatTimestamp(userConsents.withdrawConsent.timestamp)}</div>
              )}
            </div>
          </div>
        )}

        {/* Legal / Docs */}
        <RowButton onClick={onOpenJDVM} ariaLabel="Joi Data Valuation Model">
          <span>Joi Data Valuation Model</span>
          <Chevron />
        </RowButton>

        <RowButton onClick={onOpenPrivacy} ariaLabel="Privacy Policy">
          <span>Privacy Policy</span>
          <Chevron />
        </RowButton>

        <RowButton onClick={onOpenTOS} ariaLabel="Terms of Service">
          <span>Terms of Service</span>
          <Chevron />
        </RowButton>

        {/* Sign out */}
        <RowButton
          onClick={handleLogout}
          ariaLabel="Sign Out"
        >
          <span style={{ color: '#dc2626', fontWeight: 600 }}>Sign Out</span>
        </RowButton>

        {/* Footer version */}
        <div style={styles.footerVersion}>Version {version} ({build})</div>
      </div>
    </div>
  );
}

/* ---------- Small building blocks ---------- */

function SectionTitle({ children }) {
  return <div style={styles.sectionTitle}>{children}</div>;
}

function Row({ children }) {
  return <div style={styles.row}>{children}</div>;
}

function RowButton({ children, onClick, ariaLabel, disabled = false }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        ...styles.row,
        ...styles.rowButton,
        ...(disabled ? styles.disabledButton : {})
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Inline styles (no external CSS needed) ---------- */

const styles = {
  screen: {
    minHeight: '100vh',
    background:
      'linear-gradient(180deg, rgba(18,77,120,1) 0%, rgba(27,88,130,1) 35%, rgba(36,100,144,1) 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '32px 16px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#fff',
    borderRadius: 28,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center',
  },
  notAuthenticatedContainer: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  notAuthenticatedTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '12px',
  },
  notAuthenticatedText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'backgroundColor 0.2s',
  },
  headerRow: {
    position: 'relative',
    padding: '20px 16px 12px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#0f172a',
  },
  versionTop: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 14,
    color: '#374151',
  },
  sectionTitle: {
    padding: '12px 16px 8px 16px',
    fontSize: 16,
    fontWeight: 700,
    color: '#1f2937',
    background: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
    fontSize: 16,
    color: '#111827',
  },
  rowButton: {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  primaryText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.2,
  },
  secondaryText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  tertiaryText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  valueText: {
    marginLeft: 'auto',
    color: '#6b7280',
  },
  linkButton: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    fontWeight: 600,
    cursor: 'pointer',
  },
  chevron: {
    marginLeft: 'auto',
    color: '#9ca3af',
    fontSize: 22,
    lineHeight: 1,
  },
  checkbox: {
    marginLeft: 'auto',
    width: 20,
    height: 20,
    cursor: 'pointer',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: 12,
  },
  statusMessage: {
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 14,
    color: '#374151',
  },
  helpText: {
    padding: '8px 16px',
    fontSize: 12,
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
  },
  helpLink: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  consentInfo: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
  },
  consentTimestamp: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  footerVersion: {
    textAlign: 'center',
    padding: '20px 0',
    color: '#6b7280',
    fontSize: 14,
  },
};