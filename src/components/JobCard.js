import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import AppBadge from './ui/AppBadge';
import AppCard from './ui/AppCard';

function formatEarnings(amount) {
  if (typeof amount !== 'number') {
    return 'INR 0';
  }
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function JobCard({ job, onPress }) {
  const { colors, spacing, typography } = useAppTheme();
  const badgeLabel = job.status === 'COMPLETED' ? job.paymentStatus || 'UNPAID' : job.status;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress(job)}>
      <AppCard style={{ marginBottom: spacing[1] }}>
        <View style={styles.topRow}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{job.id}</Text>
          <AppBadge label={badgeLabel} />
        </View>

        <View style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Pickup</Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{job.pickup}</Text>
        </View>

        <View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Drop</Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{job.drop}</Text>
        </View>

        <View style={[styles.bottomRow, { borderTopColor: colors.border, marginTop: spacing[2], paddingTop: spacing[1] }]}>
          <View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Date</Text>
            <Text style={[typography.caption, { color: colors.textPrimary }]}>{job.date}</Text>
          </View>
          <View style={styles.earningsBlock}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Earnings</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{formatEarnings(job.earnings)}</Text>
          </View>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsBlock: {
    alignItems: 'flex-end',
  },
});

export default JobCard;
