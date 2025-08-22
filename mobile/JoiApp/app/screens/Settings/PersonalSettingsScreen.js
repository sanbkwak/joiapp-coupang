// src/screens/Settings/PersonalSettingsScreen.js
import React, { useMemo, useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useI18n } from '../../i18n/I18nProvider';      // 🔑 global i18n
import styles from './PersonalSettingsScreen.styles';

// Storage keys
const KEYS = {
  token: 'authToken',
  language: 'appLanguage',               // 'system' | 'en' | 'ko'
  consentDataUsage: 'dataUsageEnabled',  // 'true' | 'false'
  consentTs: 'dataUsageChangedAt',
};

// Helpers
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

const openStatic = (url, t) =>
  Linking.openURL(url).catch(() => {
    Alert.alert(t('unavailable') || 'Unavailable', t('page_not_ready') || 'This page is not available yet.');
  });

// Local “API” stubs backed by AsyncStorage so things persist
const saveConsent = async (enabled) => {
  try {
    const ts = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.consentDataUsage, enabled ? 'true' : 'false');
    await AsyncStorage.setItem(KEYS.consentTs, ts);
    return { ok: true, ts };
  } catch {
    return { ok: false };
  }
};

const withdrawConsentLocal = async () => {
  try {
    const ts = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.consentDataUsage, 'false');
    await AsyncStorage.setItem(KEYS.consentTs, ts);
    return { ok: true, ts };
  } catch {
    return { ok: false };
  }
};

const persistLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(KEYS.language, lang);
    return true;
  } catch {
    return false;
  }
};

const sendDeleteAccount = async () => {
  // Replace with your real API call later
  return true;
};

// Small UI helpers
const MenuRow = ({ title, onPress, showArrow = true, rightComponent = null, danger = false }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress}>
    <Text style={[styles.menuText, danger && styles.dangerText]}>{title}</Text>
    {rightComponent ? rightComponent : showArrow && (
      <Text style={[styles.arrow, danger && styles.dangerText]}>›</Text>
    )}
  </TouchableOpacity>
);

const SectionHeader = ({ children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{children}</Text>
  </View>
);

export default function PersonalSettingsScreen() {
  const router = useRouter();
  const { t, setLocale } = useI18n();  // 🔑 app-wide translator + setter

  // Load persisted language once so the modal reflects saved choice
  const [language, setLanguage] = useState('en'); // 'system' | 'en' | 'ko'
  useEffect(() => {
    (async () => {
      const savedLang = await AsyncStorage.getItem(KEYS.language);
      if (savedLang) setLanguage(savedLang);
    })();
  }, []);

  // Replace with real values when you have user data
  const email = 'alexwong@example.com';
  const masked = useMemo(() => maskEmail(email), [email]);
  const [canEdit] = useState(true);
  const [points] = useState(1250);

  // UI state
  const [langModal, setLangModal] = useState(false);
  const [dataUsage, setDataUsage] = useState(false);
  const [consentMeta, setConsentMeta] = useState({ version: 'v1.0', ts: '2025-08-20' });

  const languageLabel =
    language === 'system' ? (t('follow_system') || 'Follow system')
    : language === 'ko' ? '한국어'
    : 'English';

  // Handlers
  const onToggleDataUsage = async (val) => {
    setDataUsage(val);
    const { ok, ts } = await saveConsent(val);
    if (!ok) {
      setDataUsage(!val);
      Alert.alert(t('error') || 'Error', t('consent_update_failed') || 'Could not update consent. Please try again.');
    } else {
      setConsentMeta((m) => ({ ...m, ts: ts?.slice(0, 10) || m.ts }));
    }
  };

  const handleEditPress = () => {
    if (!canEdit) return;
    Alert.alert(t('edit_email') || 'Edit Email', t('edit_email_desc') || 'Email edit screen goes here.');
  };

  const handleViewSurveyResults = () => {
    router.push('/survey');
  };

  const confirmWithdrawConsent = () => {
    Alert.alert(
      t('withdraw_consent') || 'Withdraw Consent',
      t('withdraw_consent_desc') || 'This will stop data collection and analysis immediately.',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('confirm') || 'Confirm',
          style: 'destructive',
          onPress: async () => {
            const { ok, ts } = await withdrawConsentLocal();
            if (ok) {
              setDataUsage(false);
              setConsentMeta((m) => ({ ...m, ts: ts?.slice(0, 10) || m.ts }));
              Alert.alert(t('consent_withdrawn') || 'Consent Withdrawn',
                t('consent_withdrawn_desc') || 'We updated your settings and blocked analysis/uploads.');
            } else {
              Alert.alert(t('error') || 'Error', t('withdraw_failed') || 'Failed to withdraw consent. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(t('sign_out') || 'Sign Out', t('sign_out_confirm') || 'Are you sure you want to sign out?', [
      { text: t('cancel') || 'Cancel', style: 'cancel' },
      {
        text: t('sign_out') || 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(KEYS.token);
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('delete_account') || 'Delete Account',
      t('delete_account_desc') || 'This is permanent. Your data will be deleted (subject to legal retention).',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await sendDeleteAccount();
            if (ok) {
              await AsyncStorage.removeItem(KEYS.token);
              Alert.alert(t('deleted') || 'Deleted',
                t('deleted_desc') || 'Your account is scheduled for deletion. You will be logged out.');
              router.replace('/auth/login');
            } else {
              Alert.alert(t('error') || 'Error',
                t('delete_failed') || 'Could not delete account. Please try again.');
            }
          },
        },
      ],
    );
  };

  // Change language app-wide (updates provider + persists choice)
  const selectLanguage = async (key) => {
    setLanguage(key);          // reflects in the modal label
    await persistLanguage(key);
    await setLocale(key);      // 🔑 updates the global provider → whole app re-renders
    setLangModal(false);
  };

  // 🔽 FULL RETURN (scrollable)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('personal') || 'Personal'}</Text>
            <Text style={styles.version}>{(t('version') || 'Version')} 1.0</Text>
          </View>

          {/* Account */}
          <SectionHeader>{t('account') || 'Account'}</SectionHeader>
          <View style={styles.accountRow}>
            <View>
              <Text style={styles.accountEmail}>{masked}</Text>
            </View>
            {canEdit && (
              <TouchableOpacity onPress={handleEditPress}>
                <Text style={styles.editButton}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <MenuRow
            title={t('myPoint') || 'My Point'}
            onPress={() => {}}
            showArrow={false}
            rightComponent={<Text style={styles.points}>{points} Szup</Text>}
          />
          <MenuRow title={t('viewSurvey') || 'View Survey Results'} onPress={handleViewSurveyResults} />

          {/* Settings */}
          <SectionHeader>{t('settings') || 'Settings'}</SectionHeader>
          <MenuRow
            title={t('language') || 'Language'}
            onPress={() => setLangModal(true)}
            rightComponent={<Text style={styles.languageText}>{languageLabel}</Text>}
          />
          <MenuRow title={t('notifications') || 'Notifications'} onPress={() => Linking.openSettings?.()} />
          <MenuRow title={t('cameraMic') || 'Camera & Microphone'} onPress={() => Linking.openSettings?.()} />

          {/* Consents */}
          <SectionHeader>{t('consents') || 'Consents'}</SectionHeader>
          <MenuRow
            title={t('dataUsage') || 'Data Usage'}
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
          <MenuRow title={t('withdrawConsent') || 'Withdraw Consent'} onPress={confirmWithdrawConsent} />

          {/* Legal */}
          <SectionHeader>{t('legal') || 'Legal'}</SectionHeader>
          <MenuRow
            title={t('dataValuation') || 'Joi Data Valuation Model'}
            onPress={() => openStatic('https://example.com/legal/joi-data-valuation', t)}
          />
          <MenuRow title={t('privacy') || 'Privacy Policy'} onPress={() => openStatic('https://example.com/legal/privacy', t)} />
          <MenuRow title={t('terms') || 'Terms of Service'} onPress={() => openStatic('https://example.com/legal/terms', t)} />

          {/* Session */}
          <MenuRow title={t('signOut') || 'Sign Out'} onPress={handleSignOut} />

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>{t('dangerZone') || 'Danger Zone'}</Text>
            <Pressable onPress={handleDeleteAccount} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>{t('deleteAccount') || 'Delete Account'}</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerVersion}>{(t('version') || 'Version')} 1.0 (1)</Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={langModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLangModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('language') || 'Language'}</Text>
            {[
              { key: 'system', label: t('follow_system') || 'Follow system' },
              { key: 'en', label: 'English' },
              { key: 'ko', label: '한국어' },
            ].map((opt) => (
              <Pressable
                key={opt.key}
                style={styles.modalRow}
                onPress={() => selectLanguage(opt.key)}
              >
                <Text style={styles.modalText}>{opt.label}</Text>
                {language === opt.key && (
                  <Text style={styles.modalCheck}>{Platform.OS === 'ios' ? '✓' : '✔'}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
