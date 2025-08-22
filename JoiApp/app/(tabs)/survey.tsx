// app/(tabs)/survey.tsx
import React from 'react';
import RequireAuth from '../_components/RequireAuth';
import JoiQuestionnaire from '../screens/Survey/JoiQuestionnaire';

export default function SurveyRoute() {
  return (
    <RequireAuth>
      <JoiQuestionnaire />
    </RequireAuth>
  );
}
