// app/_components/RequireAuth.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('authToken'); // set this after login
      setAuthed(!!token);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!authed) return <Redirect href="/auth/login" />;
  return <>{children}</>;
}
