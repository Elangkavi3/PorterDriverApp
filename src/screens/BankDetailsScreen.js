import React, { useCallback, useMemo, useState } from 'react';
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
  } catch (_error) {
    return fallback;
  }
}

function maskAccountNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) {
    return 'Not Available';
  }

  const tail = digits.slice(-4);
  return `XXXX${tail}`;
}

function BankDetailsScreen({ navigation }) {
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [currentAccountMasked, setCurrentAccountMasked] = useState('Not Available');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [confirmNewAccountNumber, setConfirmNewAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function loadDetails() {
        const raw = await AsyncStorage.getItem(BANK_DETAILS_KEY);
        const stored = parseJSON(raw, null);

        if (stored) {
          setAccountHolderName(stored.accountHolderName || '');
          setBankName(stored.bankName || '');
          setCurrentAccountMasked(maskAccountNumber(stored.accountNumber));
        } else {
          setCurrentAccountMasked('Not Available');
        }

        setNewAccountNumber('');
        setConfirmNewAccountNumber('');
        setIfscCode('');
      }

      loadDetails();
    }, []),
  );

  const trimmedAccountHolderName = accountHolderName.trim();
  const trimmedBankName = bankName.trim();
  const trimmedNewAccountNumber = newAccountNumber.trim();
  const trimmedConfirmAccountNumber = confirmNewAccountNumber.trim();
  const trimmedIfscCode = ifscCode.trim().toUpperCase();

  const accountNumbersMatch =
    trimmedNewAccountNumber.length > 0 &&
    trimmedConfirmAccountNumber.length > 0 &&
    trimmedNewAccountNumber === trimmedConfirmAccountNumber;

  const isSaveEnabled = useMemo(
    () =>
      trimmedAccountHolderName.length > 0 &&
      trimmedBankName.length > 0 &&
      trimmedIfscCode.length > 0 &&
      accountNumbersMatch,
    [
      accountNumbersMatch,
      trimmedAccountHolderName.length,
      trimmedBankName.length,
      trimmedIfscCode.length,
    ],
  );

  const onSave = async () => {
    if (!trimmedAccountHolderName || !trimmedBankName || !trimmedNewAccountNumber || !trimmedConfirmAccountNumber || !trimmedIfscCode) {
      Alert.alert('Incomplete Details', 'Please fill all bank details before saving.');
      return;
    }

    if (trimmedNewAccountNumber !== trimmedConfirmAccountNumber) {
      Alert.alert('Account Mismatch', 'New account number and confirmation must match.');
      return;
    }

    const payload = {
      accountHolderName: trimmedAccountHolderName,
      bankName: trimmedBankName,
      accountNumber: trimmedNewAccountNumber,
      ifscCode: trimmedIfscCode,
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

            <Text style={styles.label}>Current Account Number (Read-only)</Text>
            <View style={styles.readOnlyValue}>
              <Text style={styles.readOnlyText}>{currentAccountMasked}</Text>
            </View>

            <Text style={styles.label}>New Account Number</Text>
            <TextInput
              value={newAccountNumber}
              onChangeText={value => setNewAccountNumber(value.replace(/\D/g, ''))}
              style={styles.input}
              placeholder="Enter new account number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Confirm New Account Number</Text>
            <TextInput
              value={confirmNewAccountNumber}
              onChangeText={value => setConfirmNewAccountNumber(value.replace(/\D/g, ''))}
              style={styles.input}
              placeholder="Re-enter new account number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              value={ifscCode}
              onChangeText={value => setIfscCode(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              style={styles.input}
              placeholder="SBIN0001234"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
            />

            {!accountNumbersMatch && trimmedConfirmAccountNumber.length > 0 ? (
              <Text style={styles.validationText}>Account numbers must match.</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.saveButton, !isSaveEnabled ? styles.saveButtonDisabled : null]}
              onPress={onSave}
              activeOpacity={0.85}
              disabled={!isSaveEnabled}
            >
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
  readOnlyValue: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  readOnlyText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  validationText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
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
  saveButtonDisabled: {
    backgroundColor: '#374151',
  },
});

export default BankDetailsScreen;
