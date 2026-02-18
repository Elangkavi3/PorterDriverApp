import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../i18n/LanguageProvider';

const DEMO_OTP = '123456';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const STORAGE_KEYS = {
  isLoggedIn: 'isLoggedIn',
  authToken: 'authToken',
  authTokenExpiry: 'authTokenExpiry',
};

function OTPScreen({ navigation, route }) {
  const { t } = useLanguage();
  const mobileNumber = route?.params?.mobileNumber || '';
  const [otp, setOtp] = useState('');
  const isValidOtp = useMemo(() => otp.length === 6, [otp]);

  const handleOtpChange = value => {
    const next = value.replace(/\D/g, '').slice(0, 6);
    setOtp(next);
  };

  const handleVerifyOtp = useCallback(async () => {
    if (!isValidOtp) {
      Alert.alert(t('auth.invalidOtpTitle'), t('auth.invalidOtpLength'));
      return;
    }

    if (otp !== DEMO_OTP) {
      Alert.alert(t('auth.invalidOtpTitle'), t('auth.invalidOtpDemo', { otp: DEMO_OTP }));
      return;
    }

    try {
      const now = Date.now();
      const token = `DRV-${mobileNumber || 'TOKEN'}-${now}`;
      const expiry = now + TOKEN_TTL_MS;

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.isLoggedIn, 'true'],
        [STORAGE_KEYS.authToken, token],
        [STORAGE_KEYS.authTokenExpiry, String(expiry)],
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
      Alert.alert(t('auth.verifyOtpFailed'), t('auth.tryAgain'));
    }
  }, [isValidOtp, mobileNumber, navigation, otp, t]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('auth.verifyOtpTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.otpSentTo', {
            number: mobileNumber ? `+91 ${mobileNumber}` : t('auth.yourNumber'),
          })}
        </Text>
        <Text style={styles.hint}>{t('auth.demoOtp', { otp: DEMO_OTP })}</Text>

        <TextInput
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={6}
          placeholder={t('auth.otpPlaceholder')}
          placeholderTextColor="#6B7280"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.primaryButton, !isValidOtp ? styles.primaryButtonDisabled : null]}
          activeOpacity={0.9}
          onPress={handleVerifyOtp}
          disabled={!isValidOtp}
        >
          <Text style={styles.primaryButtonText}>{t('auth.verifyOtp')}</Text>
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
