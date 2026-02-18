import React, { useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../i18n/LanguageProvider';

function LoginScreen({ navigation }) {
  const { t } = useLanguage();
  const [mobile, setMobile] = useState('');
  const isValidMobile = useMemo(() => mobile.length === 10, [mobile]);

  const handleMobileChange = value => {
    const next = value.replace(/\D/g, '').slice(0, 10);
    setMobile(next);
  };

  const handleSendOtp = () => {
    if (!isValidMobile) {
      Alert.alert(t('auth.invalidNumberTitle'), t('auth.invalidNumberMessage'));
      return;
    }

    navigation.navigate('OTP', { mobileNumber: mobile });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.brand}>{t('brand.appName')}</Text>
        <Text style={styles.title}>{t('auth.driverLoginTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.enterMobile')}</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            value={mobile}
            onChangeText={handleMobileChange}
            keyboardType="number-pad"
            maxLength={10}
            placeholder={t('auth.mobilePlaceholder')}
            placeholderTextColor="#6B7280"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !isValidMobile ? styles.primaryButtonDisabled : null]}
          activeOpacity={0.9}
          onPress={handleSendOtp}
          disabled={!isValidMobile}
        >
          <Text style={styles.primaryButtonText}>{t('auth.sendOtp')}</Text>
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
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  brand: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrap: {
    marginTop: 20,
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  prefix: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
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

export default LoginScreen;
