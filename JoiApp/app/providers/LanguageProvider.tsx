import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../i18n/translations'; // ← same singleton used everywhere

export const LANG_KEY = 'appLanguage'; // 'system' | 'en' | 'ko'

type LangChoice = 'system' | 'en' | 'ko';

type Ctx = {
  language: LangChoice;          // your stored choice
  resolvedLanguage: 'en' | 'ko'; // actual language used by i18next
  setLanguage: (choice: LangChoice) => Promise<void>;
  setLocale: (choice: LangChoice) => Promise<void>; // alias (for legacy calls)
  t: typeof i18n.t;              // passthrough
};

const LanguageCtx = createContext<Ctx | null>(null);

// Map device locale to 'en' | 'ko' (expand if you add more languages)
function resolveDeviceLanguage(): 'en' | 'ko' {
  const locales = Localization.getLocales?.() || [];
  const tag = (locales[0]?.languageTag || locales[0]?.languageCode || 'en').toLowerCase();
  if (tag.startsWith('ko')) return 'ko';
  return 'en';
}

function resolveChoice(choice: LangChoice): 'en' | 'ko' {
  return choice === 'system' ? resolveDeviceLanguage() : choice;
}

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLangState] = useState<LangChoice>('en');
  const [resolvedLanguage, setResolvedLanguage] = useState<'en' | 'ko'>(resolveDeviceLanguage());

  // Load saved choice on mount
  useEffect(() => {
    (async () => {
      const saved = (await AsyncStorage.getItem(LANG_KEY)) as LangChoice | null;
      const initialChoice: LangChoice = saved || 'en';
      const initialResolved = resolveChoice(initialChoice);

      setLangState(initialChoice);
      setResolvedLanguage(initialResolved);
      await i18n.changeLanguage(initialResolved);
    })();
  }, []);

  // Keep local state in sync when i18next language changes (e.g., hot reload)
  useEffect(() => {
    const handler = (lng: string) => {
      const norm = (lng || 'en').startsWith('ko') ? 'ko' : 'en';
      setResolvedLanguage(norm);
    };
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, []);

  const applyLanguage = useCallback(async (choice: LangChoice) => {
    const resolved = resolveChoice(choice);
    setLangState(choice);
    setResolvedLanguage(resolved);
    await AsyncStorage.setItem(LANG_KEY, choice);
    await i18n.changeLanguage(resolved); // 🔑 trigger re-render with new lang
  }, []);

  const ctxValue = useMemo<Ctx>(() => ({
    language,
    resolvedLanguage,
    setLanguage: applyLanguage,
    setLocale: applyLanguage, // alias for older code
    t: i18n.t.bind(i18n),
  }), [language, resolvedLanguage, applyLanguage]);

  return <LanguageCtx.Provider value={ctxValue}>{children}</LanguageCtx.Provider>;
};

// Hooks
export function useLanguage() {
  const ctx = useContext(LanguageCtx);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// For screens that previously used useI18n()
export const useI18n = useLanguage;
