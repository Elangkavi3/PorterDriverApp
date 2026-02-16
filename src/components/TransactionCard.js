import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STATUS_COLORS = {
  SUCCESS: '#16A34A',
  PENDING: '#F59E0B',
  FAILED: '#DC2626',
};

function formatAmount(transaction) {
  const amount = typeof transaction?.amount === 'number' ? transaction.amount : 0;
  const sign = transaction?.type === 'DEBIT' ? '-' : '+';
  return `${sign} INR ${amount.toLocaleString('en-IN')}`;
}

function TransactionCard({ transaction, onPress }) {
  const statusColor = STATUS_COLORS[transaction.status] || STATUS_COLORS.PENDING;
  const isFailed = transaction.status === 'FAILED';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, isFailed ? styles.failedCard : null]}
      onPress={() => onPress(transaction)}
    >
      <View style={styles.headerRow}>
        <Text style={styles.transactionId}>{transaction.id}</Text>
        <Text style={[styles.amount, transaction.type === 'DEBIT' ? styles.debitAmount : styles.creditAmount]}>
          {formatAmount(transaction)}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.source}>{transaction.source}</Text>
        <Text style={styles.date}>{transaction.date}</Text>
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{transaction.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  failedCard: {
    borderColor: '#7F1D1D',
    backgroundColor: '#26181C',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionId: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  creditAmount: {
    color: '#16A34A',
  },
  debitAmount: {
    color: '#FFFFFF',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  source: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  date: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    alignItems: 'flex-start',
    borderTopColor: '#374151',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 94,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default TransactionCard;
