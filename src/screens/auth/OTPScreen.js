import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEMO_OTP = '123456';

function OTPScreen({ navigation, route }) {
  const mobileNumber = route?.params?.mobileNumber || '';
  const [otp, setOtp] = useState('');
  const isValidOtp = useMemo(() => otp.length === 6, [otp]);

  const handleOtpChange = value => {
    const next = value.replace(/\D/g, '').slice(0, 6);
    setOtp(next);
  };

  const handleVerifyOtp = useCallback(async () => {
    if (!isValidOtp) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit OTP.');
      return;
    }

    if (otp !== DEMO_OTP) {
      Alert.alert('Invalid OTP', 'Use demo OTP 123456.');
      return;
    }

    try {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      navigation.replace('AadhaarKYC');
    } catch (_error) {
      Alert.alert('Unable to verify OTP', 'Please try again.');
    }
  }, [isValidOtp, navigation, otp]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          OTP sent to {mobileNumber ? `+91 ${mobileNumber}` : 'your mobile number'}
        </Text>
        <Text style={styles.hint}>Demo OTP: {DEMO_OTP}</Text>

        <TextInput
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#6B7280"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.primaryButton, !isValidOtp ? styles.primaryButtonDisabled : null]}
          activeOpacity={0.9}
          onPress={handleVerifyOtp}
          disabled={!isValidOtp}
        >
          <Text style={styles.primaryButtonText}>Verify OTP</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    marginTop: 8,
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    marginTop: 20,
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
    paddingHorizontal: 16,
  },
  primaryButton: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#374151',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OTPScreen;
