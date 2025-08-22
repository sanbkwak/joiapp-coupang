import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="survey"
        options={{
          title: 'Survey',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name={focused ? 'list-circle' : 'list-circle-outline'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
