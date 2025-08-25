import React from 'react';
import RequireAuth from '../_components/RequireAuth';
import PersonalSettingsScreen from '../_screens/Settings/PersonalSettingsScreen';

export default function PersonalRoute() {
  return (
    <RequireAuth>
      <PersonalSettingsScreen />
    </RequireAuth>
  );
}
