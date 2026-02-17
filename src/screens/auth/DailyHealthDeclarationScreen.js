import React, { useCallback } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

function DailyHealthDeclarationScreen({ navigation }) {
  const handleFinalConfirmation = useCallback(async () => {
    try {
      await AsyncStorage.setItem('isKYCCompleted', 'true');
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
      Alert.alert('Unable to finish KYC', 'Please try again.');
    }
  }, [navigation]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Daily Health Declaration Screen</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={handleFinalConfirmation}
        >
          <Text style={styles.primaryButtonText}>Confirm & Finish KYC</Text>
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
