import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STATUS_COLORS = {
  ACTIVE: '#2563EB',
  COMPLETED: '#16A34A',
  CANCELLED: '#DC2626',
};

function formatEarnings(amount) {
  if (typeof amount !== 'number') {
    return 'INR 0';
  }
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function JobCard({ job, onPress }) {
  const badgeColor = STATUS_COLORS[job.status] || STATUS_COLORS.ACTIVE;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={() => onPress(job)}
    >
      <View style={styles.topRow}>
        <Text style={styles.jobId}>{job.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>

      <View style={styles.routeBlock}>
        <Text style={styles.routeLabel}>Pickup</Text>
        <Text style={styles.routeText}>{job.pickup}</Text>
      </View>

      <View style={styles.routeBlock}>
        <Text style={styles.routeLabel}>Drop</Text>
        <Text style={styles.routeText}>{job.drop}</Text>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{job.date}</Text>
        </View>
        <View style={styles.earningsBlock}>
          <Text style={styles.metaLabel}>Earnings</Text>
          <Text style={styles.earningsValue}>{formatEarnings(job.earnings)}</Text>
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
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  jobId: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 108,
    paddingHorizontal: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  routeBlock: {
    marginBottom: 10,
  },
  routeLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomRow: {
    borderTopColor: '#374151',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingTop: 12,
  },
  metaLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  earningsBlock: {
    alignItems: 'flex-end',
  },
  earningsValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default JobCard;
