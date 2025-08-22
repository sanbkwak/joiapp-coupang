// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { LanguageProvider } from './providers/LanguageProvider';
import i18n, { initI18n } from './i18n/translations'; // ← import the init

initI18n(); // ← initialize i18next exactly once

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LanguageProvider>
  );
}
