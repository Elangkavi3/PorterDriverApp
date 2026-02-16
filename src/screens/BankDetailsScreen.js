import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const BANK_DETAILS_KEY = 'driverBankDetails';

const COLORS = {
  background: '#111827',
  card: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  primary: '#2563EB',
  border: '#374151',
};

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function BankDetailsScreen({ navigation }) {
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function loadDetails() {
        const raw = await AsyncStorage.getItem(BANK_DETAILS_KEY);
        const stored = parseJSON(raw, null);

        if (stored) {
          setAccountHolderName(stored.accountHolderName || '');
          setBankName(stored.bankName || '');
          setAccountNumber(stored.accountNumber || '');
          setIfscCode(stored.ifscCode || '');
        }
      }

      loadDetails();
    }, []),
  );

  const onSave = async () => {
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      Alert.alert('Incomplete Details', 'Please fill all bank details before saving.');
      return;
    }

    const payload = {
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(payload));

      if (Platform.OS === 'android') {
        ToastAndroid.show('Bank details saved successfully.', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Bank details saved successfully.');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Unable to save bank details.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Bank Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              style={styles.input}
              placeholder="Ravi Kumar"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              style={styles.input}
              placeholder="State Bank of India"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              style={styles.input}
              placeholder="000000000000"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              value={ifscCode}
              onChangeText={setIfscCode}
              style={styles.input}
              placeholder="SBIN0001234"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.85}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    padding: 20,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#111827',
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 16,
    marginTop: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BankDetailsScreen;
