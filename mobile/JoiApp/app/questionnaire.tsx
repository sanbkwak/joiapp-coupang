import React from 'react';
import { Redirect } from 'expo-router';

export default function QuestionnaireAlias() {
  // Forward any stray /questionnaire links to the real screen
  return <Redirect href="/survey" />;
}
