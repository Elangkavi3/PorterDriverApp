import React, { useCallback, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TransactionCard from '../components/TransactionCard';

const STORAGE_KEYS = {
  walletBalance: 'walletBalance',
  walletTransactions: 'walletTransactions',
  tripExpenses: 'tripExpenses',
};

const MOCK_TRANSACTIONS = [
  {
    id: 'TXN-1001',
    type: 'CREDIT',
    source: 'Trip PD-48271',
    amount: 3200,
    status: 'SUCCESS',
    date: '2024-02-14',
  },
  {
    id: 'TXN-1002',
    type: 'DEBIT',
    source: 'Withdrawal',
    amount: 1400,
    status: 'PENDING',
    date: '2024-02-13',
  },
  {
    id: 'TXN-1003',
    type: 'CREDIT',
    source: 'Trip PD-48269',
    amount: 2100,
    status: 'FAILED',
    date: '2024-02-12',
  },
];

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

function computeBalance(transactions) {
  const total = transactions.reduce((sum, transaction) => {
    if (transaction.status === 'FAILED') {
      return sum;
    }
    if (transaction.type === 'CREDIT') {
      return sum + transaction.amount;
    }
    return sum - transaction.amount;
  }, 0);
  return total > 0 ? total : 0;
}

function parseDate(dateText) {
  const parts = String(dateText || '')
    .split('-')
    .map(Number);
  if (parts.length !== 3) {
    return null;
  }
  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return null;
  }
  const value = new Date(year, month - 1, day);
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day
  ) {
    return null;
  }
  return value;
}

function getCreditValueForRange(transactions, range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return transactions.reduce((sum, transaction) => {
    if (transaction.type !== 'CREDIT' || transaction.status !== 'SUCCESS') {
      return sum;
    }

    const valueDate = parseDate(transaction.date);
    if (!valueDate) {
      return sum;
    }

    const txDate = new Date(valueDate.getFullYear(), valueDate.getMonth(), valueDate.getDate());

    if (range === 'TODAY') {
      if (txDate.getTime() !== today.getTime()) {
        return sum;
      }
      return sum + transaction.amount;
    }

    if (range === 'THIS_WEEK') {
      if (txDate < startOfWeek || txDate > today) {
        return sum;
      }
      return sum + transaction.amount;
    }

    if (
      txDate.getFullYear() === today.getFullYear() &&
      txDate.getMonth() === today.getMonth() &&
      txDate <= today
    ) {
      return sum + transaction.amount;
    }

    return sum;
  }, 0);
}

function computeExpensesTotal(expensesRaw) {
  if (typeof expensesRaw === 'number') {
    return expensesRaw;
  }

  if (!Array.isArray(expensesRaw)) {
    return 0;
  }

  return expensesRaw.reduce((sum, item) => {
    if (typeof item === 'number') {
      return sum + item;
    }
    if (typeof item === 'string') {
      const parsed = Number(item);
      return Number.isFinite(parsed) ? sum + parsed : sum;
    }
    if (item && typeof item.amount === 'number') {
      return sum + item.amount;
    }
    return sum;
  }, 0);
}

function formatAmount(amount) {
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function WalletScreen({ navigation }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      const storageData = await AsyncStorage.multiGet([
        STORAGE_KEYS.walletBalance,
        STORAGE_KEYS.walletTransactions,
        STORAGE_KEYS.tripExpenses,
      ]);
      const dataMap = Object.fromEntries(storageData);

      const parsedTransactions = parseStoredJson(
        dataMap[STORAGE_KEYS.walletTransactions],
        null,
      );
      const normalizedTransactions = Array.isArray(parsedTransactions)
        ? parsedTransactions.map(normalizeTransaction)
        : MOCK_TRANSACTIONS.map(normalizeTransaction);

      const storedBalance = Number(dataMap[STORAGE_KEYS.walletBalance]);
      const nextBalance = Number.isFinite(storedBalance)
        ? storedBalance
        : computeBalance(normalizedTransactions);

      const parsedExpenses = parseStoredJson(dataMap[STORAGE_KEYS.tripExpenses], []);
      const nextExpenses = computeExpensesTotal(parsedExpenses);

      const updates = [];

      if (!Array.isArray(parsedTransactions)) {
        updates.push([
          STORAGE_KEYS.walletTransactions,
          JSON.stringify(normalizedTransactions),
        ]);
      }

      if (!Number.isFinite(storedBalance)) {
        updates.push([STORAGE_KEYS.walletBalance, String(nextBalance)]);
      }

      if (!dataMap[STORAGE_KEYS.tripExpenses]) {
        updates.push([STORAGE_KEYS.tripExpenses, JSON.stringify([])]);
      }

      if (updates.length > 0) {
        await AsyncStorage.multiSet(updates);
      }

      setTransactions(normalizedTransactions);
      setWalletBalance(nextBalance > 0 ? nextBalance : 0);
      setTotalExpenses(nextExpenses > 0 ? nextExpenses : 0);
    } catch (_error) {
      const fallback = MOCK_TRANSACTIONS.map(normalizeTransaction);
      setTransactions(fallback);
      setWalletBalance(computeBalance(fallback));
      setTotalExpenses(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [loadWalletData]),
  );

  const earningsToday = useMemo(
    () => getCreditValueForRange(transactions, 'TODAY'),
    [transactions],
  );
  const earningsThisWeek = useMemo(
    () => getCreditValueForRange(transactions, 'THIS_WEEK'),
    [transactions],
  );
  const earningsThisMonth = useMemo(
    () => getCreditValueForRange(transactions, 'THIS_MONTH'),
    [transactions],
  );

  const renderHeader = () => (
    <View>
      {!isOnline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>No Internet - Transactions will sync later</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>{formatAmount(walletBalance)}</Text>
        <Text style={styles.balanceSubtext}>Last updated just now</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={walletBalance <= 0}
          style={[
            styles.withdrawButton,
            walletBalance <= 0 ? styles.withdrawButtonDisabled : null,
          ]}
          onPress={() => navigation.navigate('WithdrawScreen')}
        >
          <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Earnings Summary</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={styles.summaryAmount}>{formatAmount(earningsToday)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Week</Text>
          <Text style={styles.summaryAmount}>{formatAmount(earningsThisWeek)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>{formatAmount(earningsThisMonth)}</Text>
        </View>
      </View>

      <View style={styles.expenseCard}>
        <Text style={styles.expenseTitle}>Total Expenses Logged</Text>
        <Text style={styles.expenseValue}>{formatAmount(totalExpenses)}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No transactions yet</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={transaction =>
                navigation.navigate('TransactionDetailScreen', {
                  transactionId: transaction.id,
                  transaction,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  offlineBanner: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 20,
  },
  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 6,
  },
  balanceSubtext: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },
  withdrawButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#374151',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 104,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  expenseCard: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  expenseTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
  },
  expenseValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default WalletScreen;
