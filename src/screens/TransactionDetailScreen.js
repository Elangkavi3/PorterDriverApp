import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = 'walletTransactions';

const STATUS_COLORS = {
  SUCCESS: '#16A34A',
  PENDING: '#F59E0B',
  FAILED: '#DC2626',
};

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

function formatAmount(transaction) {
  const sign = transaction.type === 'DEBIT' ? '-' : '+';
  return `${sign} INR ${transaction.amount.toLocaleString('en-IN')}`;
}

function TransactionDetailScreen({ route }) {
  const [transaction, setTransaction] = useState(
    route?.params?.transaction ? normalizeTransaction(route.params.transaction) : null,
  );
  const [isLoading, setIsLoading] = useState(!route?.params?.transaction);

  useEffect(() => {
    let mounted = true;

    const loadTransaction = async () => {
      if (route?.params?.transaction) {
        setIsLoading(false);
        return;
      }

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const list = parseStoredJson(raw, []);
        const normalizedList = Array.isArray(list)
          ? list.map(normalizeTransaction)
          : [];
        const found = normalizedList.find(item => item.id === route?.params?.transactionId);
        if (mounted) {
          setTransaction(found || null);
        }
      } catch (_error) {
        if (mounted) {
          setTransaction(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadTransaction();

    return () => {
      mounted = false;
    };
  }, [route?.params?.transaction, route?.params?.transactionId]);

  const retryTransaction = async () => {
    if (!transaction || transaction.status !== 'FAILED') {
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const list = parseStoredJson(raw, []);
      const normalizedList = Array.isArray(list)
        ? list.map(normalizeTransaction)
        : [];

      const nextList = normalizedList.map(item =>
        item.id === transaction.id
          ? { ...item, status: 'PENDING' }
          : item,
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
      setTransaction(prev => (prev ? { ...prev, status: 'PENDING' } : prev));
    } catch (_error) {
      Alert.alert('Error', 'Unable to retry this transaction right now.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Transaction Detail</Text>

        {transaction ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{transaction.id}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{transaction.type}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Source</Text>
              <Text style={styles.value}>{transaction.source}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>{formatAmount(transaction)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  { borderColor: STATUS_COLORS[transaction.status] || '#F59E0B' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_COLORS[transaction.status] || '#F59E0B' },
                  ]}
                >
                  {transaction.status}
                </Text>
              </View>
            </View>
            <View style={styles.rowNoBorder}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{transaction.date}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}

        {transaction?.status === 'FAILED' ? (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.retryButton}
            onPress={retryTransaction}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
    padding: 16,
  },
  row: {
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingBottom: 12,
  },
  rowNoBorder: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    minWidth: 94,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 220,
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TransactionDetailScreen;
