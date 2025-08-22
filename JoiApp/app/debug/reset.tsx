import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';

export default function ResetAppState() {
  const [done, setDone] = React.useState(false);

  useEffect(() => {
    (async () => {
      await AsyncStorage.multiRemove(['hasOnboarded', 'authToken']);
      setDone(true);
    })();
  }, []);

  if (!done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href="/onboarding" />;
}
