import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import styles from './PersonalSettingsScreen.styles';

const PersonalSettingsScreen = () => {
  const [dataUsage, setDataUsage] = useState(false);
  const [withdrawConsent, setWithdrawConsent] = useState(false);

  const handleEditPress = () => {
    Alert.alert('Edit Account', 'Edit functionality would be implemented here');
  };

  const handleViewSurveyResults = () => {
    Alert.alert('Survey Results', 'Survey results would be displayed here');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Notification settings would open here');
  };

  const handleCameraMicrophone = () => {
    Alert.alert('Camera & Microphone', 'Camera and microphone settings would open here');
  };

  const handleConsents = () => {
    Alert.alert('Consents', 'Consent management would open here');
  };

  const handleJoiDataValuation = () => {
    Alert.alert('Joi Data Valuation Model', 'Data valuation information would be displayed here');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy would be displayed here');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service would be displayed here');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => console.log('Signed out') }
      ]
    );
  };

  const MenuRow = ({ title, onPress, showArrow = false, rightComponent = null }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Text style={styles.menuText}>{title}</Text>
      {rightComponent ? rightComponent : showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Personal</Text>
          <Text style={styles.version}>Version 1.0</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
        </View>

        <View style={styles.accountRow}>
          <View>
            <Text style={styles.accountName}>Alex Wong</Text>
            <Text style={styles.accountEmail}>alexwong@example.com</Text>
          </View>
          <TouchableOpacity onPress={handleEditPress}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>

        <MenuRow 
          title="View Survey Results" 
          onPress={handleViewSurveyResults} 
        />

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.menuText}>Language</Text>
          <Text style={styles.languageText}>English</Text>
        </View>

        <MenuRow 
          title="Notifications" 
          onPress={handleNotifications} 
          showArrow={true} 
        />

        <MenuRow 
          title="Camera & Microphone" 
          onPress={handleCameraMicrophone} 
          showArrow={true} 
        />

        <MenuRow 
          title="Consents" 
          onPress={handleConsents} 
        />

        <MenuRow 
          title="Data Usage" 
          onPress={() => {}}
          rightComponent={
            <Switch
              value={dataUsage}
              onValueChange={setDataUsage}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          }
        />

        <MenuRow 
          title="Withdraw Consent" 
          onPress={() => {}}
          rightComponent={
            <Switch
              value={withdrawConsent}
              onValueChange={setWithdrawConsent}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          }
        />

        <MenuRow 
          title="Joi Data Valuation Model" 
          onPress={handleJoiDataValuation} 
        />

        <MenuRow 
          title="Privacy Policy" 
          onPress={handlePrivacyPolicy} 
        />

        <MenuRow 
          title="Terms of Service" 
          onPress={handleTermsOfService} 
        />

        <MenuRow 
          title="Sign Out" 
          onPress={handleSignOut} 
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>Version 1.0 (1)</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PersonalSettingsScreen;