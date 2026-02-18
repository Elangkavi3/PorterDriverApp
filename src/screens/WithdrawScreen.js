import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEYS = {
  walletBalance: 'walletBalance',
  walletTransactions: 'walletTransactions',
};

const BANK_DETAILS_KEY = 'driverBankDetails';

function parseStoredJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function normalizeTransaction(transaction) {
  return {
    id: transaction?.id || `TXN-${Date.now()}`,
    type: transaction?.type === 'DEBIT' ? 'DEBIT' : 'CREDIT',
    source: transaction?.source || 'Trip',
    amount: typeof transaction?.amount === 'number' ? transaction.amount : 0,
    status: ['SUCCESS', 'PENDING', 'FAILED'].includes(transaction?.status)
      ? transaction.status
      : 'PENDING',
    date: transaction?.date || '2024-02-14',
  };
}

function getDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatAmount(amount) {
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function maskAccountNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) {
    return 'Not Available';
  }
  return `XXXX${digits.slice(-4)}`;
}

function maskIfscCode(value) {
  const clean = String(value || '').trim().toUpperCase();
  if (!clean) {
    return 'Not Available';
  }
  if (clean.length <= 4) {
    return `${clean}****`;
  }
  return `${clean.slice(0, 4)}****`;
}

function WithdrawScreen({ navigation }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [amountText, setAmountText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.walletBalance,
        STORAGE_KEYS.walletTransactions,
        BANK_DETAILS_KEY,
      ]);
      const dataMap = Object.fromEntries(values);

      const nextBalance = Number(dataMap[STORAGE_KEYS.walletBalance]);
      const rawTransactions = parseStoredJson(dataMap[STORAGE_KEYS.walletTransactions], []);
      const nextTransactions = Array.isArray(rawTransactions)
        ? rawTransactions.map(normalizeTransaction)
        : [];
      const nextBankDetails = parseStoredJson(dataMap[BANK_DETAILS_KEY], null);

      setWalletBalance(Number.isFinite(nextBalance) && nextBalance > 0 ? nextBalance : 0);
      setTransactions(nextTransactions);
      setBankDetails(nextBankDetails);
    } catch (_error) {
      setWalletBalance(0);
      setTransactions([]);
      setBankDetails(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleConfirmWithdrawal = useCallback(async () => {
    const amount = Number(amountText);

    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage('Enter a valid amount greater than 0.');
      return;
    }

    if (amount > walletBalance) {
      setErrorMessage('Withdrawal amount exceeds available balance.');
      return;
    }

    try {
      const nextBalance = walletBalance - amount;
      const transaction = {
        id: `TXN-${Date.now()}`,
        type: 'DEBIT',
        source: 'Withdrawal',
        amount,
        status: 'PENDING',
        date: getDateStamp(),
      };

      const nextTransactions = [transaction, ...transactions];

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.walletBalance, String(nextBalance)],
        [STORAGE_KEYS.walletTransactions, JSON.stringify(nextTransactions)],
      ]);

      navigation.goBack();
    } catch (_error) {
      Alert.alert('Error', 'Unable to process withdrawal right now.');
    }
  }, [amountText, navigation, transactions, walletBalance]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Withdraw Funds</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Available Balance</Text>
          <Text style={styles.balanceValue}>{formatAmount(walletBalance)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Withdrawal Amount</Text>
          <TextInput
            value={amountText}
            onChangeText={text => {
              setAmountText(text.replace(/[^0-9]/g, ''));
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor="#6B7280"
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Bank Details</Text>
          {bankDetails ? (
            <View>
              <Text style={styles.bankPrimary}>{bankDetails.accountHolderName || 'Account Holder'}</Text>
              <Text style={styles.bankSecondary}>{bankDetails.bankName || 'Bank Name'}</Text>
              <Text style={styles.bankSecondary}>
                Account: {maskAccountNumber(bankDetails.accountNumber)}
              </Text>
              <Text style={styles.bankSecondary}>IFSC: {maskIfscCode(bankDetails.ifscCode)}</Text>
            </View>
          ) : (
            <Text style={styles.bankSecondary}>No bank details saved. Add details in Profile.</Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={walletBalance <= 0}
          style={[
            styles.confirmButton,
            walletBalance <= 0 ? styles.confirmButtonDisabled : null,
          ]}
          onPress={handleConfirmWithdrawal}
        >
          <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    minHeight: 56,
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  bankPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bankSecondary: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: '#374151',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WithdrawScreen;
