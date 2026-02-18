import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const KEYS = {
  isKYCCompleted: 'isKYCCompleted',
  onboardingCompleted: 'onboardingCompleted',
  dailyHealthCheckDate: 'dailyHealthCheckDate',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function DailyHealthDeclarationScreen({ navigation }) {
  const handleFinalConfirmation = useCallback(async () => {
    try {
      await AsyncStorage.multiSet([
        [KEYS.isKYCCompleted, 'true'],
        [KEYS.onboardingCompleted, 'true'],
        [KEYS.dailyHealthCheckDate, todayStamp()],
      ]);

      const rootNavigation = navigation.getParent();
      if (rootNavigation) {
        rootNavigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (_error) {
      Alert.alert('Unable to finish onboarding', 'Please try again.');
    }
  }, [navigation]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Health Declaration Intro</Text>
        <Text style={styles.subtitle}>Onboarding step. Daily compliance checks will run at each day start.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={handleFinalConfirmation}
        >
          <Text style={styles.primaryButtonText}>Confirm & Continue To Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 20,
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DailyHealthDeclarationScreen;
