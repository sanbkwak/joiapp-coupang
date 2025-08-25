// src/i18n/I18nProvider.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './translations';

const STORAGE_KEY = 'appLanguage'; // 'en' | 'ko' | 'system'

const I18nContext = createContext({
  locale: 'en',
  setLocale: (_l) => {},
  t: (k, opts) => i18n.t(k, opts),
});

function baseLangOfSystem() {
  // 'en-US' -> 'en', 'ko-KR' -> 'ko'
  return (Localization.locale || 'en').split('-')[0];
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');

  // load saved language once
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const next = saved === 'system' ? baseLangOfSystem() : saved || baseLangOfSystem();
      i18n.locale = next;
      setLocaleState(next);
    })();
  }, []);

  // change language (and persist)
  const setLocale = useCallback(async (key) => {
    const next = key === 'system' ? baseLangOfSystem() : key;
    i18n.locale = next;
    setLocaleState(next);
    await AsyncStorage.setItem(STORAGE_KEY, key); // store exactly what user chose
  }, []);

  // translator bound to current locale so components re-render when it changes
  const t = useCallback((k, opts) => i18n.t(k, opts), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
