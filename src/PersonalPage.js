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
  initializeUserIfNeeded, 
  validateAccountDeletion,
  getAccountDeletionStatus,
  deleteUserAccount,
  cancelAccountDeletion 
 
} from './utils/userModel';

// Enhanced PersonalPage.js - Account Deletion Section
 
 import AdvancedDeleteAccountDialog from './AdvancedDeleteAccountDialog';


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
  onDeleteAccountConfirm, // optional async confirm for account deletion
}) {
  const { user, logout, loading: authLoading } = useAuth() || { user: null, logout: async () => {}, loading: true };
  const { publicKey, connect, isConnected, isInitialized } = useContext(WalletContext) || {};

  // State for user data
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [userConsents, setUserConsents] = useState({});
  const [userSettings, setUserSettings] = useState({});
  const [devicePermissions, setDevicePermissions] = useState({});
  

  // NEW: Joi Dashboard state
  const [showJoiDashboard, setShowJoiDashboard] = useState(false);
  const [joiDashboardData, setJoiDashboardData] = useState(null);
  const [joiDashboardLoading, setJoiDashboardLoading] = useState(false);

  // Get display name and email from Firebase user or fallback
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'No email provided';
  
  // Mask email for privacy (show only first and last character)
  const maskedEmail = email !== 'No email provided' ? 
    `${email[0]}${'*'.repeat(email.length - 2)}${email[email.length - 1]}` : 
    email;

  const [language, setLanguage] = useState(initialLanguage);
  const [dataUsageConsent, setDataUsageConsent] = useState(false);
  const [withdrawConsent, setWithdrawConsent] = useState(false);
  
  // Freighter wallet states
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  
  // UI states
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEnhancedDeleteDialog, setShowEnhancedDeleteDialog] = useState(false);
  const navigate = useNavigate();

  // NEW: Fetch Joi validation data from your Firebase collections
  const fetchJoiDashboardData = async (userId) => {
    try {
      setJoiDashboardLoading(true);
      
      // Simulate API calls to your Flask backend endpoints
      const [
        coupangInterimResponse,
        coupangDeepResponse,
        phq2Data,
        gad2Data,
        facialData,
        voiceData
      ] = await Promise.all([
        // These would be actual API calls to your Flask endpoints
        fetchCoupangInterim(userId),
        fetchCoupangDeep(userId),
        fetchUserSubcollection(userId, 'phq2'),
        fetchUserSubcollection(userId, 'gad2'),
        fetchUserSubcollection(userId, 'facial_results'),
        fetchUserSubcollection(userId, 'voice_results')
      ]);

      const dashboardData = {
        interim: coupangInterimResponse,
        deep: coupangDeepResponse,
        behavioral: {
          phq2: phq2Data,
          gad2: gad2Data,
          facial: facialData,
          voice: voiceData
        },
        validation: {
          phq2ValidationRate: calculateValidationRate(phq2Data),
          gad2ValidationRate: calculateValidationRate(gad2Data),
          facialAccuracy: calculateFacialAccuracy(facialData),
          voiceAccuracy: calculateVoiceAccuracy(voiceData),
          redFlags: detectRedFlags(phq2Data, gad2Data, facialData),
          dataQuality: calculateDataQuality(phq2Data, gad2Data, facialData, voiceData)
        }
      };

      setJoiDashboardData(dashboardData);
      
    } catch (error) {
      console.error('Error fetching Joi dashboard data:', error);
      setConnectionStatus('Failed to load validation data');
    } finally {
      setJoiDashboardLoading(false);
    }
  };

  // Helper functions for API calls (you'll implement these based on your backend)
  const fetchCoupangInterim = async (userId) => {
    // Call your Flask API: GET /api/v1/coupang/analysis_results
    const response = await fetch(`/api/v1/coupang/analysis_results`, {
      headers: {
        'Authorization': `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  };

  const fetchCoupangDeep = async (userId) => {
    // This would fetch from your coupang_deep collection
    // You might need to add an endpoint for this
    return {};
  };

  const fetchUserSubcollection = async (userId, subcollection) => {
    // You might need to add endpoints to fetch user subcollection data
    // Or use Firebase client SDK directly
    return [];
  };

  // Validation calculation functions
  const calculateValidationRate = (data) => {
    if (!data || data.length === 0) return 0;
    const validEntries = data.filter(entry => 
      entry.score !== undefined && 
      entry.score >= 0 && 
      entry.score <= 6 && 
      entry.timestamp
    );
    return ((validEntries.length / data.length) * 100).toFixed(1);
  };

  const calculateFacialAccuracy = (facialData) => {
    if (!facialData || facialData.length === 0) return 0;
    const validEmotions = ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fear', 'disgust'];
    const validEntries = facialData.filter(entry => 
      validEmotions.includes(entry.dominant_emotion)
    );
    return ((validEntries.length / facialData.length) * 100).toFixed(1);
  };

  const calculateVoiceAccuracy = (voiceData) => {
    if (!voiceData || voiceData.length === 0) return 0;
    const validEntries = voiceData.filter(entry => 
      entry.confidence >= 0.5 && entry.predicted_emotion
    );
    return ((validEntries.length / voiceData.length) * 100).toFixed(1);
  };

  const detectRedFlags = (phq2Data, gad2Data, facialData) => {
    const flags = [];
    
    // PHQ-2 escalation detection
    if (phq2Data && phq2Data.length >= 2) {
      const recent = phq2Data.slice(-2);
      if (recent[1].score - recent[0].score >= 2) {
        flags.push({
          type: 'PHQ2_ESCALATION',
          severity: 'high',
          description: 'Rapid increase in depression scores'
        });
      }
    }

    // GAD-2 sustained elevation
    if (gad2Data && gad2Data.length >= 3) {
      const recentGAD = gad2Data.slice(-3);
      if (recentGAD.every(entry => entry.score >= 3)) {
        flags.push({
          type: 'GAD2_SUSTAINED_HIGH',
          severity: 'medium',
          description: 'Sustained high anxiety levels'
        });
      }
    }

    return flags;
  };

  const calculateDataQuality = (phq2Data, gad2Data, facialData, voiceData) => {
    const totalExpected = 20; // Expected data points
    const actualData = (phq2Data?.length || 0) + 
                      (gad2Data?.length || 0) + 
                      (facialData?.length || 0) + 
                      (voiceData?.length || 0);
    
    return Math.min((actualData / totalExpected) * 100, 100).toFixed(1);
  };

  // NEW: Handle Joi Dashboard opening
  const handleOpenJoiDashboard = async () => {
    if (!user?.uid) return;
    
    setShowJoiDashboard(true);
    if (!joiDashboardData) {
      await fetchJoiDashboardData(user.uid);
    }
    
    // Log the activity
    await logUserActivity(user.uid, 'joi_dashboard_opened', {
      timestamp: new Date().toISOString()
    });
  };

  const handleCloseJoiDashboard = () => {
    setShowJoiDashboard(false);
  };

  // Export Joi data function
  const handleExportJoiData = async (exportType) => {
    try {
      setConnectionStatus('Exporting validation data...');
      
      const response = await fetch(`/api/v1/coupang/export/${exportType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `joi_${exportType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setConnectionStatus('Export completed successfully');
        setTimeout(() => setConnectionStatus(''), 3000);
      } else {
        throw new Error('Export failed');
      }
      
    } catch (error) {
      console.error('Export error:', error);
      setConnectionStatus('Export failed. Please try again.');
      setTimeout(() => setConnectionStatus(''), 3000);
    }
  };
 
 

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
      setConnectionStatus('⚠ WalletContext not available');
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
        errorMessage = '⚠ Connection denied by user';
      } else if (err.message.includes('not found') || err.message.includes('not detected')) {
        errorMessage = '⚠ Freighter wallet not found. Please install the Freighter extension from freighter.app';
      } else if (err.message.includes('not available')) {
        errorMessage = '⚠ Freighter API not available. Please update your extension or try refreshing the page.';
      } else {
        errorMessage = `⚠ Error: ${err.message}`;
      }
      
      setConnectionStatus(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWithdrawToggle = () => {
    setShowWithdrawDialog(true);
  };

  const confirmWithdrawConsent = async () => {
    if (typeof onWithdrawConsentConfirm === 'function') {
      const ok = await onWithdrawConsentConfirm(true);
      if (!ok) return;
    }
    
    try {
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
      
      setConnectionStatus('⚠ All consents have been withdrawn. Data collection stopped.');
      setTimeout(() => setConnectionStatus(''), 5000);
      
    } catch (error) {
      console.error('Error updating consent:', error);
      alert('Failed to update consent. Please try again.');
    } finally {
      setShowWithdrawDialog(false);
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
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        // Update setting based on permission
        const granted = permission === 'granted';
        await updateUserSetting(user.uid, 'notifications.push', granted);
        
        setUserSettings(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            push: granted
          }
        }));
        
        const message = granted ? 'Notifications enabled' : 'Notifications blocked';
        setConnectionStatus(`${granted ? '✅' : '⚠'} ${message}`);
        setTimeout(() => setConnectionStatus(''), 3000);
      } else {
        setConnectionStatus('⚠ Notifications not supported in this browser');
        setTimeout(() => setConnectionStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setConnectionStatus('⚠ Failed to request notification permission');
      setTimeout(() => setConnectionStatus(''), 3000);
    }
  };

  const requestCameraMicrophonePermission = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // If successful, update permissions and stop stream
      stream.getTracks().forEach(track => track.stop());
      
      await updateDevicePermission(user.uid, 'camera', true);
      await updateDevicePermission(user.uid, 'microphone', true);
      
      // Refresh device permissions
      const updatedPermissions = await getUserDevicePermissions(user.uid);
      setDevicePermissions(updatedPermissions);
      
      setConnectionStatus('✅ Camera and microphone access granted');
      setTimeout(() => setConnectionStatus(''), 3000);
      
    } catch (error) {
      console.error('Error requesting camera/microphone permission:', error);
      
      // Update with denied status
      await updateDevicePermission(user.uid, 'camera', false);
      await updateDevicePermission(user.uid, 'microphone', false);
      
      const updatedPermissions = await getUserDevicePermissions(user.uid);
      setDevicePermissions(updatedPermissions);
      
      setConnectionStatus('⚠ Camera/microphone access denied. Check your browser settings or click here to try again.');
      setTimeout(() => setConnectionStatus(''), 5000);
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

  const getPermissionStatus = (permission) => {
    if (permission === undefined || permission === null) return '○';
    return permission ? '✓' : '○';
  };

  const getNotificationStatus = () => {
    const emailEnabled = userSettings.notifications?.email || false;
    const pushEnabled = userSettings.notifications?.push || false;
    
    if (emailEnabled && pushEnabled) return '✓';
    if (emailEnabled || pushEnabled) return '◐';
    return '○';
  };

  const getCameraMicrophoneStatus = () => {
    const cameraEnabled = devicePermissions.camera?.granted || false;
    const microphoneEnabled = devicePermissions.microphone?.granted || false;
    
    if (cameraEnabled && microphoneEnabled) return '✓';
    if (cameraEnabled || microphoneEnabled) return '◐';
    return '○';
  };
function Dialog({ title, children, onClose }) {
  return (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogContainer}>
        <div style={styles.dialogHeader}>
          <h3 style={styles.dialogTitle}>{title}</h3>
          <button
            style={styles.dialogCloseButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
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
            <div style={styles.primaryText}>
              {userData?.showDisplayName !== false ? displayName : 'User'}
            </div>
            <div style={styles.secondaryText}>{maskedEmail}</div>
            {userData && (
              <div style={styles.tertiaryText}>
                Login Count: {userData.numberOfLogins || 0} | 
                Joi Points: {userData.JoiPoints || 0}
              </div>
            )}
          </div>
          {/* Show edit button only if editing is enabled */}
          {userData?.allowEdit !== false && (
            <button
              style={styles.linkButton}
              onClick={onEditAccount}
              aria-label="Edit Account"
            >
              Edit
            </button>
          )}
        </Row>

        <RowButton onClick={onViewResults} ariaLabel="View Survey Results">
          <span>View Survey Results</span>
          <Chevron />
        </RowButton>

        {/* SECTION: Stellar Wallet - COMMENTED OUT */}
        {/*
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

        {/* Status message *//*}
        {connectionStatus && (
          <div style={styles.statusMessage}>
            {connectionStatus}
          </div>
        )}
        */}

        {/* SECTION: Settings */}
        <SectionTitle>Settings</SectionTitle>

        <RowButton
          onClick={() => setShowLanguageDialog(true)}
          ariaLabel="Language"
        >
          <span>Language</span>
          <span style={styles.valueText}>{language}</span>
          <Chevron />
        </RowButton>

        <RowButton onClick={requestNotificationPermission} ariaLabel="Notifications">
          <span>Notifications</span>
          <span style={styles.valueText}>
            {getNotificationStatus()}
          </span>
          <Chevron />
        </RowButton>

        <RowButton onClick={requestCameraMicrophonePermission} ariaLabel="Camera & Microphone">
          <span>Camera & Microphone</span>
          <span style={styles.valueText}>
            {getCameraMicrophoneStatus()}
          </span>
          <Chevron />
        </RowButton>

        {/* SECTION: Consents */}
        <SectionTitle>Consents</SectionTitle>

        <Row>
          <span>Data Usage</span>
          <div style={styles.toggleContainer}>
            <span style={styles.toggleTimestamp}>
              {formatTimestamp(userConsents.dataUsage?.timestamp)}
            </span>
            <input
              type="checkbox"
              checked={dataUsageConsent}
              onChange={(e) => handleDataUsageToggle(e.target.checked)}
              aria-label="Data Usage Consent"
              style={styles.checkbox}
            />
          </div>
        </Row>

        <RowButton onClick={handleWithdrawToggle} ariaLabel="Withdraw Consent">
          <span>Withdraw Consent</span>
          <Chevron />
        </RowButton>

        {/* Legal / Docs */}
 {/* NEW: Joi Dashboard Modal */}
 <RowButton onClick={handleOpenJoiDashboard} ariaLabel="Joi Data Validation Dashboard">
  <span>Joi Data Validation Model</span>
  <span style={styles.valueText}>
    {joiDashboardData ? '✓' : '○'}
  </span>
  <Chevron />
</RowButton>
      {showJoiDashboard && (
        <JoiDashboardModal
          user={user}
          dashboardData={joiDashboardData}
          loading={joiDashboardLoading}
          onClose={handleCloseJoiDashboard}
          onExport={handleExportJoiData}
          onRefresh={() => fetchJoiDashboardData(user.uid)}
        />
      )}

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

        {/* Delete Account - Danger Zone */}
        <RowButton
          onClick={() => setShowDeleteDialog(true)}
          ariaLabel="Delete Account"
        >
          <span style={{ color: '#dc2626', fontWeight: 600 }}>Delete Account</span>
        </RowButton>

        {/* Footer version */}
        <div style={styles.footerVersion}>Version {version} ({build})</div>
      </div>

      {/* Language Selection Dialog */}
      {showLanguageDialog && (
        <Dialog 
          title="Select Language"
          onClose={() => setShowLanguageDialog(false)}
        >
          <div style={styles.languageOptions}>
            {['English', 'Spanish', 'French', 'German', 'Chinese'].map((lang) => (
              <button
                key={lang}
                style={{
                  ...styles.languageOption,
                  ...(language === lang ? styles.languageOptionSelected : {})
                }}
                onClick={() => {
                  handleLanguageChange(lang);
                  setShowLanguageDialog(false);
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {/* Withdraw Consent Dialog */}
      {showWithdrawDialog && (
        <Dialog 
          title="Withdraw Consent"
          onClose={() => setShowWithdrawDialog(false)}
        >
          <div style={styles.dialogContent}>
            <p style={styles.warningText}>
              ⚠️ Warning: Withdrawing consent will stop all data collection immediately.
            </p>
            <p style={styles.dialogDescription}>
              This action will:
            </p>
            <ul style={styles.actionList}>
              <li>Block all analysis and upload APIs (403 + reason)</li>
              <li>Stop data collection from your account</li>
              <li>Update your consent status to false in our servers</li>
            </ul>
            <p style={styles.dialogDescription}>
              You can re-enable data collection later by toggling the Data Usage setting.
            </p>
            <div style={styles.dialogButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowWithdrawDialog(false)}
              >
                Cancel
              </button>
              <button
                style={styles.confirmButton}
                onClick={confirmWithdrawConsent}
              >
                Withdraw Consent
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Delete Account Dialog */}
              {showDeleteDialog && (
          <AdvancedDeleteAccountDialog
            user={user}
            onClose={() => setShowDeleteDialog(false)}
            onDeleteComplete={() => navigate('/login')}
            onLogout={handleLogout}
          />
      )}
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

// NEW: Joi Dashboard Modal Component
function JoiDashboardModal({ user, dashboardData, loading, onClose, onExport, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div style={joiStyles.modalOverlay}>
        <div style={joiStyles.modalContainer}>
          <div style={joiStyles.loadingContainer}>
            <div style={joiStyles.spinner}></div>
            <h3>Loading Validation Dashboard...</h3>
            <p>Analyzing behavioral patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={joiStyles.modalOverlay}>
      <div style={joiStyles.modalContainer}>
        <div style={joiStyles.modalHeader}>
          <h2>Joi Data Validation Dashboard</h2>
          <button style={joiStyles.closeButton} onClick={onClose}>×</button>
        </div>

        <div style={joiStyles.tabContainer}>
          <button 
            style={{...joiStyles.tab, ...(activeTab === 'overview' ? joiStyles.activeTab : {})}}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            style={{...joiStyles.tab, ...(activeTab === 'validation' ? joiStyles.activeTab : {})}}
            onClick={() => setActiveTab('validation')}
          >
            Validation
          </button>
          <button 
            style={{...joiStyles.tab, ...(activeTab === 'export' ? joiStyles.activeTab : {})}}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
        </div>

        <div style={joiStyles.tabContent}>
          {activeTab === 'overview' && (
            <OverviewTab dashboardData={dashboardData} />
          )}
          {activeTab === 'validation' && (
            <ValidationTab dashboardData={dashboardData} />
          )}
          {activeTab === 'export' && (
            <ExportTab onExport={onExport} />
          )}
        </div>

        <div style={joiStyles.modalFooter}>
          <button style={joiStyles.refreshButton} onClick={onRefresh}>
            Refresh Data
          </button>
          <button style={joiStyles.closeButtonSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
function ExportTab({ onExport }) {
  return (
    <div style={joiStyles.tabPanel}>
      <div style={joiStyles.exportSection}>
        <h3>Export Validated Data</h3>
        <p style={joiStyles.exportDescription}>
          Download your behavioral analytics data in various formats for analysis or compliance purposes.
        </p>
        
        <div style={joiStyles.exportGrid}>
          <button 
            style={joiStyles.exportButton}
            onClick={() => onExport('realtime_csv')}
          >
            📄 Real-time CSV
          </button>
          <button 
            style={joiStyles.exportButton}
            onClick={() => onExport('validation_report')}
          >
            📋 Validation Report
          </button>
          <button 
            style={joiStyles.exportButton}
            onClick={() => onExport('monetization_package')}
          >
            💼 Monetization Package
          </button>
          <button 
            style={joiStyles.exportButton}
            onClick={() => onExport('firebase_backup')}
          >
            🔥 Firebase Backup
          </button>
        </div>
      </div>
    </div>
  );
}
const joiStyles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '95%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: 'white',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '50%',
    width: '35px',
    height: '35px',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tab: {
    flex: 1,
    padding: '15px 20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#667eea',
    backgroundColor: 'white',
    borderBottom: '2px solid #667eea',
  },
  tabContent: {
    height: '500px',
    overflowY: 'auto',
  },
  tabPanel: {
    padding: '30px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#667eea',
    marginBottom: '5px',
  },
  metricLabel: {
    fontSize: '0.9rem',
    color: '#64748b',
  },
  redFlagsSection: {
    marginTop: '30px',
  },
  redFlag: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #f87171',
    borderRadius: '8px',
  },
  redFlagType: {
    fontWeight: '600',
    color: '#dc2626',
  },
  redFlagDescription: {
    flex: 1,
    marginLeft: '15px',
    color: '#7f1d1d',
  },
  redFlagSeverity: {
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  noRedFlags: {
    padding: '20px',
    textAlign: 'center',
    color: '#10b981',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
  },
  validationSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
  },
  qualityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  qualityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  monetizationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  monetizationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  readyBadge: {
    padding: '4px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  exportSection: {
    textAlign: 'center',
  },
  exportDescription: {
    color: '#6b7280',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  exportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  exportButton: {
    padding: '15px 20px',
    border: '2px solid #667eea',
    backgroundColor: 'transparent',
    color: '#667eea',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  closeButtonSecondary: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
};
function OverviewTab({ dashboardData }) {
  const validation = dashboardData?.validation || {};
  
  return (
    <div style={joiStyles.tabPanel}>
      <div style={joiStyles.metricsGrid}>
        <div style={joiStyles.metricCard}>
          <div style={joiStyles.metricValue}>{validation.phq2ValidationRate || '0'}%</div>
          <div style={joiStyles.metricLabel}>PHQ-2 Validation Rate</div>
        </div>
        <div style={joiStyles.metricCard}>
          <div style={joiStyles.metricValue}>{validation.gad2ValidationRate || '0'}%</div>
          <div style={joiStyles.metricLabel}>GAD-2 Validation Rate</div>
        </div>
        <div style={joiStyles.metricCard}>
          <div style={joiStyles.metricValue}>{validation.facialAccuracy || '0'}%</div>
          <div style={joiStyles.metricLabel}>Facial Analysis Accuracy</div>
        </div>
        <div style={joiStyles.metricCard}>
          <div style={joiStyles.metricValue}>{validation.voiceAccuracy || '0'}%</div>
          <div style={joiStyles.metricLabel}>Voice Analysis Accuracy</div>
        </div>
      </div>

      <div style={joiStyles.redFlagsSection}>
        <h3>Behavioral Red Flags</h3>
        {validation.redFlags && validation.redFlags.length > 0 ? (
          validation.redFlags.map((flag, index) => (
            <div key={index} style={joiStyles.redFlag}>
              <div style={joiStyles.redFlagType}>{flag.type}</div>
              <div style={joiStyles.redFlagDescription}>{flag.description}</div>
              <div style={{...joiStyles.redFlagSeverity, 
                color: flag.severity === 'high' ? '#dc2626' : '#d97706'
              }}>
                {flag.severity.toUpperCase()}
              </div>
            </div>
          ))
        ) : (
          <div style={joiStyles.noRedFlags}>No red flags detected</div>
        )}
      </div>
    </div>
  );
}

function ValidationTab({ dashboardData }) {
  const behavioral = dashboardData?.behavioral || {};
  
  return (
    <div style={joiStyles.tabPanel}>
      <div style={joiStyles.validationSection}>
        <h3>Data Quality Assessment</h3>
        <div style={joiStyles.qualityGrid}>
          <div style={joiStyles.qualityItem}>
            <span>PHQ-2 Data Points:</span>
            <span>{behavioral.phq2?.length || 0}</span>
          </div>
          <div style={joiStyles.qualityItem}>
            <span>GAD-2 Data Points:</span>
            <span>{behavioral.gad2?.length || 0}</span>
          </div>
          <div style={joiStyles.qualityItem}>
            <span>Facial Analysis Sessions:</span>
            <span>{behavioral.facial?.length || 0}</span>
          </div>
          <div style={joiStyles.qualityItem}>
            <span>Voice Analysis Sessions:</span>
            <span>{behavioral.voice?.length || 0}</span>
          </div>
        </div>
      </div>

      <div style={joiStyles.validationSection}>
        <h3>Monetization Readiness</h3>
        <div style={joiStyles.monetizationGrid}>
          <div style={joiStyles.monetizationItem}>
            <span>Insurance Scoring:</span>
            <span style={joiStyles.readyBadge}>Ready</span>
          </div>
          <div style={joiStyles.monetizationItem}>
            <span>B2B Wellness Programs:</span>
            <span style={joiStyles.readyBadge}>Ready</span>
          </div>
          <div style={joiStyles.monetizationItem}>
            <span>Clinical Research:</span>
            <span style={joiStyles.readyBadge}>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
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
    width: 20,
    height: 20,
    cursor: 'pointer',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  toggleTimestamp: {
    fontSize: 11,
    color: '#9ca3af',
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
  footerVersion: {
    textAlign: 'center',
    padding: '20px 0',
    color: '#6b7280',
    fontSize: 14,
  },
  
  // Dialog styles
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  dialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: 400,
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  dialogCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    color: '#6b7280',
    cursor: 'pointer',
    padding: 0,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogContent: {
    padding: '20px',
  },
  dialogDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.5,
    margin: '8px 0',
  },
  warningText: {
    fontSize: 14,
    color: '#d97706',
    backgroundColor: '#fef3c7',
    padding: '12px',
    borderRadius: 8,
    border: '1px solid #f59e0b',
    margin: '0 0 16px 0',
  },
  dangerText: {
    fontSize: 14,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: 8,
    border: '1px solid #f87171',
    margin: '0 0 16px 0',
  },
  actionList: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.5,
    margin: '8px 0',
    paddingLeft: '20px',
  },
  dialogButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'backgroundColor 0.2s',
  },
  confirmButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'backgroundColor 0.2s',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'backgroundColor 0.2s',
  },
  
  // Language selection styles
  languageOptions: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  languageOption: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 16,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  languageOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    color: '#1d4ed8',
    fontWeight: 600,
  },
 // New styles for enhanced deletion dialog
  infoBox: {
    backgroundColor: '#dbeafe',
    border: '1px solid #3b82f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    color: '#1d4ed8',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  deletionDate: {
    fontSize: 18,
    fontWeight: 700,
    color: '#dc2626',
    margin: '8px 0',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #f87171',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  blockerList: {
    color: '#dc2626',
    margin: '8px 0',
    paddingLeft: 20,
  },
  dangerBox: {
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  dangerTitle: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 12px 0',
  },
  consequenceList: {
    color: '#dc2626',
    margin: '12px 0',
    paddingLeft: 20,
    lineHeight: 1.6,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#d97706',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  warningList: {
    color: '#d97706',
    margin: '8px 0',
    paddingLeft: 20,
  },
  gracePeriodSection: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  gracePeriodLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  gracePeriodInfo: {
    marginTop: 12,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 1.5,
  },
  gracePeriodControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  selectInput: {
    padding: '4px 8px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 13,
  },
  finalWarning: {
    backgroundColor: '#450a0a',
    color: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  finalWarningTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  confirmationSection: {
    marginBottom: 16,
  },
  confirmationLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: '#374151',
  },
  confirmationInput: {
    width: '100%',
    padding: 12,
    border: '2px solid #dc2626',
    borderRadius: 6,
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  finalActions: {
    textAlign: 'center',
    marginBottom: 16,
  },
  lastChance: {
    fontSize: 14,
    color: '#dc2626',
  },
  cancelDeletionButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  proceedButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px auto',
  },
  processingState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  processingSteps: {
    textAlign: 'left',
    marginTop: 20,
    fontSize: 14,
    lineHeight: 2,
  },
  actionSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};
