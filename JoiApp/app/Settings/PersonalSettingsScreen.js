import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import styles from './PersonalSettingsScreen.styles';

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${
    domain
  }`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

// ---- stubs you can wire to your API later ----
const saveConsent = async (enabled) => {
  // TODO: POST /api/v1/consents/status { data_usage: enabled }
  return true;
};
const withdrawConsentOnServer = async () => {
  // TODO: POST /api/v1/consents/withdraw  => blocks analysis/upload APIs (403 + reason)
  return true;
};
const persistLanguage = async (lang) => {
  // TODO: persist 'system' | 'en' | 'ko'
  return true;
};
const sendDeleteAccount = async () => {
  // TODO: POST /api/v1/account/delete (immediate logout -> revoke tokens)
  return true;
};
// -----------------------------------------------

const openStatic = (url) => Linking.openURL(url).catch(() => {
  Alert.alert('Unavailable', 'This page is not available yet.');
});

const PersonalSettingsScreen = () => {
  // ACCOUNT
  const email = 'alexwong@example.com'; // replace with real user email
  const masked = useMemo(() => maskEmail(email), [email]);
  const [canEdit, setCanEdit] = useState(true); // flip to enable/disable “Edit”
  const [points] = useState(1250); // replace with real points

  // SETTINGS
  const [language, setLanguage] = useState('en'); // 'en' | 'ko' | 'system'
  const [langModal, setLangModal] = useState(false);

  // CONSENTS
  const [dataUsage, setDataUsage] = useState(false);
  const [consentMeta, setConsentMeta] = useState({ version: 'v1.0', ts: '2025-08-20' });

  const onToggleDataUsage = async (val) => {
    setDataUsage(val);
    const ok = await saveConsent(val);
    if (!ok) {
      setDataUsage(!val);
      Alert.alert('Error', 'Could not update consent. Please try again.');
    }
  };

  const handleEditPress = () => {
    if (!canEdit) return;
    Alert.alert('Edit Email', 'Email edit screen goes here.');
  };

  const handleViewSurveyResults = () => {
    Alert.alert('Survey Results', 'Show last result or navigate to full history.');
  };

  const guideToSettings = (what) => {
    Alert.alert(
      what,
      'If permission is denied, open Settings to enable it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings?.() },
      ],
    );
  };

  const confirmWithdrawConsent = () => {
    Alert.alert(
      'Withdraw Consent',
      'This will stop data collection and analysis immediately.\n\nSummary: retain (legal minimum) / anonymize where possible / delete non-required data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            const ok = await withdrawConsentOnServer();
            if (ok) {
              setDataUsage(false);
              Alert.alert('Consent Withdrawn', 'We updated your settings and blocked analysis/uploads.');
            } else {
              Alert.alert('Error', 'Failed to withdraw consent. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => console.log('Signed out') },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This is permanent. Your data will be deleted (subject to legal retention).\nNo recovery.\n\nTip: You will be logged out and tokens revoked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await sendDeleteAccount();
            if (ok) {
              Alert.alert('Deleted', 'Your account is scheduled for deletion. You will be logged out.');
              // TODO: revoke tokens + navigate to login
            } else {
              Alert.alert('Error', 'Could not delete account. Please try again.');
            }
          },
        },
      ],
    );
  };

  const MenuRow = ({ title, onPress, showArrow = true, rightComponent = null, danger = false }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Text style={[styles.menuText, danger && styles.dangerText]}>{title}</Text>
      {rightComponent ? rightComponent : showArrow && <Text style={[styles.arrow, danger && styles.dangerText]}>›</Text>}
    </TouchableOpacity>
  );

  const SectionHeader = ({ children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );

  const languageLabel = language === 'system' ? 'Follow system' : language === 'ko' ? '한국어' : 'English';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Personal</Text>
          <Text style={styles.version}>Version 1.0</Text>
        </View>

        {/* Account */}
        <SectionHeader>Account</SectionHeader>
        <View style={styles.accountRow}>
          <View>
            {/* Name hidden per spec */}
            <Text style={styles.accountEmail}>{masked}</Text>
          </View>
          {canEdit && (
            <TouchableOpacity onPress={handleEditPress}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <MenuRow
          title="My Point"
          onPress={() => {}}
          showArrow={false}
          rightComponent={<Text style={styles.points}>{points} Szup</Text>}
        />
        <MenuRow title="View Survey Results" onPress={handleViewSurveyResults} />

        {/* Settings */}
        <SectionHeader>Settings</SectionHeader>
        <MenuRow
          title="Language"
          onPress={() => setLangModal(true)}
          rightComponent={<Text style={styles.languageText}>{languageLabel}</Text>}
        />
        <MenuRow title="Notifications" onPress={() => guideToSettings('Notifications')} />
        <MenuRow title="Camera & Microphone" onPress={() => guideToSettings('Camera & Microphone')} />

        {/* Consents */}
        <SectionHeader>Consents</SectionHeader>
        <MenuRow
          title="Data Usage"
          onPress={() => {}}
          showArrow={false}
          rightComponent={
            <View style={styles.toggleRowRight}>
              <Text style={styles.helperText}>{`${consentMeta.version} • ${consentMeta.ts}`}</Text>
              <Switch
                value={dataUsage}
                onValueChange={onToggleDataUsage}
                trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          }
        />
        <MenuRow title="Withdraw Consent" onPress={confirmWithdrawConsent} />

        {/* Legal */}
        <SectionHeader>Legal</SectionHeader>
        <MenuRow
          title="Joi Data Valuation Model"
          onPress={() => openStatic('https://example.com/legal/joi-data-valuation')}
        />
        <MenuRow title="Privacy Policy" onPress={() => openStatic('https://example.com/legal/privacy')} />
        <MenuRow title="Terms of Service" onPress={() => openStatic('https://example.com/legal/terms')} />

        {/* Session */}
        <MenuRow title="Sign Out" onPress={handleSignOut} />

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Pressable onPress={handleDeleteAccount} style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>Version 1.0 (1)</Text>
        </View>
      </View>

      {/* Language Modal */}
      <Modal visible={langModal} transparent animationType="fade" onRequestClose={() => setLangModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Language</Text>
            {[
              { key: 'system', label: 'Follow system' },
              { key: 'en', label: 'English' },
              { key: 'ko', label: '한국어' },
            ].map((opt) => (
              <Pressable
                key={opt.key}
                style={styles.modalRow}
                onPress={async () => {
                  setLanguage(opt.key);
                  await persistLanguage(opt.key);
                  setLangModal(false);
                }}
              >
                <Text style={styles.modalText}>{opt.label}</Text>
                {language === opt.key && <Text style={styles.modalCheck}>{Platform.OS === 'ios' ? '✓' : '✔'}</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default PersonalSettingsScreen;
