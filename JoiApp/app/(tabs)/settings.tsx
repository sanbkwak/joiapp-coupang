// app/(tabs)/settings.tsx
import React from 'react';
import RequireAuth from '../_components/RequireAuth';
import PersonalSettingsScreen from '../screens/Settings/PersonalSettingsScreen';

export default function SettingsRoute() {
  return (
    <RequireAuth>
      <PersonalSettingsScreen />
    </RequireAuth>
  );
}