// app/screens/Settings/PersonalSettingsScreen.js
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, Switch, Alert,
  Modal, Pressable, Linking, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';            // ✅ use t from react-i18next
import { useLanguage } from '../../providers/LanguageProvider'; // for setLanguage only
import styles from './PersonalSettingsScreen.styles';

const KEYS = {
  token: 'authToken',
  language: 'appLanguage',               // 'system' | 'en' | 'ko'
  consentDataUsage: 'dataUsageEnabled',  // 'true' | 'false'
  consentTs: 'dataUsageChangedAt',
};

// helpers
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

const openStatic = (url, t) =>
  Linking.openURL(url).catch(() => {
    Alert.alert(
      t('settingsExtra.unavailable', { defaultValue: 'Unavailable' }),
      t('settingsExtra.page_not_ready', { defaultValue: 'This page is not available yet.' })
    );
  });

// async “api” backed by storage
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
const sendDeleteAccount = async () => true;

// small UI helpers
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
  const { t } = useTranslation();         // ✅ use this t
  const { setLanguage } = useLanguage();  // ✅ change language via provider

  // language modal state mirrors persisted choice
  const [uiLanguage, setUiLanguage] = useState('en');
  useEffect(() => {
    (async () => {
      const savedLang = await AsyncStorage.getItem(KEYS.language);
      if (savedLang) setUiLanguage(savedLang);
    })();
  }, []);

  // mock user bits
  const email = 'alexwong@example.com';
  const masked = useMemo(() => maskEmail(email), [email]);
  const [canEdit] = useState(true);
  const [points] = useState(1250);

  // UI state
  const [langModal, setLangModal] = useState(false);
  const [dataUsage, setDataUsage] = useState(false);
  const [consentMeta, setConsentMeta] = useState({ version: 'v1.0', ts: '2025-08-20' });

  const languageLabel =
    uiLanguage === 'system'
      ? t('language.followSystem')
      : uiLanguage === 'ko'
        ? t('language.korean')
        : t('language.english');

  // handlers
  const onToggleDataUsage = async (val) => {
    setDataUsage(val);
    const { ok, ts } = await saveConsent(val);
    if (!ok) {
      setDataUsage(!val);
      Alert.alert(t('settingsExtra.error'), t('settingsExtra.consent_update_failed'));
    } else {
      setConsentMeta((m) => ({ ...m, ts: ts?.slice(0, 10) || m.ts }));
    }
  };

  const handleEditPress = () => {
    if (!canEdit) return;
    Alert.alert(t('settingsExtra.edit_email'), t('settingsExtra.edit_email_desc'));
  };

  const confirmWithdrawConsent = () => {
    Alert.alert(
      t('settingsExtra.withdraw_consent'),
      t('settingsExtra.withdraw_consent_desc'),
      [
        { text: t('settingsExtra.cancel'), style: 'cancel' },
        {
          text: t('settingsExtra.confirm'),
          style: 'destructive',
          onPress: async () => {
            const { ok, ts } = await withdrawConsentLocal();
            if (ok) {
              setDataUsage(false);
              setConsentMeta((m) => ({ ...m, ts: ts?.slice(0, 10) || m.ts }));
              Alert.alert(t('settingsExtra.consent_withdrawn'), t('settingsExtra.consent_withdrawn_desc'));
            } else {
              Alert.alert(t('settingsExtra.error'), t('settingsExtra.withdraw_failed'));
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      t('settingsExtra.sign_out'),
      t('settingsExtra.sign_out_confirm'),
      [
        { text: t('settingsExtra.cancel'), style: 'cancel' },
        {
          text: t('settingsExtra.sign_out'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(KEYS.token);
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settingsExtra.delete_account'),
      t('settingsExtra.delete_account_desc'),
      [
        { text: t('settingsExtra.cancel'), style: 'cancel' },
        {
          text: t('settingsExtra.delete'),
          style: 'destructive',
          onPress: async () => {
            const ok = await sendDeleteAccount();
            if (ok) {
              await AsyncStorage.removeItem(KEYS.token);
              Alert.alert(t('settingsExtra.deleted'), t('settingsExtra.deleted_desc'));
              router.replace('/auth/login');
            } else {
              Alert.alert(t('settingsExtra.error'), t('settingsExtra.delete_failed'));
            }
          },
        },
      ],
    );
  };

  const selectLanguage = async (key) => {
    setUiLanguage(key);
    await persistLanguage(key);
    await setLanguage(key);  // calls i18n.changeLanguage under the hood
    setLangModal(false);
  };

  // render
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
            <Text style={styles.title}>{t('settingsExtra.personal')}</Text>
            <Text style={styles.version}>{t('settingsExtra.version')} 1.0</Text>
          </View>

          {/* Account */}
          <SectionHeader>{t('settingsExtra.account')}</SectionHeader>
          <View style={styles.accountRow}>
            <View>
              <Text style={styles.accountEmail}>{masked}</Text>
            </View>
            {canEdit && (
              <TouchableOpacity onPress={handleEditPress}>
                <Text style={styles.editButton}>{t('settingsExtra.edit')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <MenuRow
            title={t('settingsExtra.myPoint')}
            onPress={() => {}}
            showArrow={false}
            rightComponent={<Text style={styles.points}>{points} Szup</Text>}
          />
          <MenuRow title={t('settingsExtra.viewSurvey')} onPress={() => router.push('/survey')} />

          {/* Settings */}
          <SectionHeader>{t('settingsExtra.settings')}</SectionHeader>
          <MenuRow
            title={t('settings.languageRow')}
            onPress={() => setLangModal(true)}
            rightComponent={<Text style={styles.languageText}>{languageLabel}</Text>}
          />
          <MenuRow title={t('settingsExtra.notifications')} onPress={() => Linking.openSettings?.()} />
          <MenuRow title={t('settingsExtra.cameraMic')} onPress={() => Linking.openSettings?.()} />

          {/* Consents */}
          <SectionHeader>{t('settingsExtra.consents')}</SectionHeader>
          <MenuRow
            title={t('settings.dataUsage')}
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
          <MenuRow title={t('settings.withdrawConsent')} onPress={confirmWithdrawConsent} />

          {/* Legal */}
          <SectionHeader>{t('settingsExtra.legal')}</SectionHeader>
          <MenuRow
            title={t('settingsExtra.dataValuation')}
            onPress={() => openStatic('https://example.com/legal/joi-data-valuation', t)}
          />
          <MenuRow title={t('settingsExtra.privacy')} onPress={() => openStatic('https://example.com/legal/privacy', t)} />
          <MenuRow title={t('settingsExtra.terms')} onPress={() => openStatic('https://example.com/legal/terms', t)} />

          {/* Session */}
          <MenuRow title={t('settingsExtra.signOut')} onPress={handleSignOut} />

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>{t('settingsExtra.dangerZone')}</Text>
            <Pressable onPress={handleDeleteAccount} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>{t('settingsExtra.deleteAccount')}</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerVersion}>{t('settingsExtra.version')} 1.0 (1)</Text>
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
            <Text style={styles.modalTitle}>{t('language.title')}</Text>
            {[
              { key: 'system', label: t('language.followSystem') },
              { key: 'en', label: t('language.english') },
              { key: 'ko', label: t('language.korean') },
            ].map((opt) => (
              <Pressable
                key={opt.key}
                style={styles.modalRow}
                onPress={() => selectLanguage(opt.key)}
              >
                <Text style={styles.modalText}>{opt.label}</Text>
                {uiLanguage === opt.key && (
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
