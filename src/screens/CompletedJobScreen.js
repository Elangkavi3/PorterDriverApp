import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import { useAppTheme } from '../theme/ThemeProvider';

const STORAGE_KEY = 'jobsList';

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

function normalizeJob(job) {
  return {
    id: job?.id || 'PD-00000',
    pickup: job?.pickup || 'Unknown Pickup',
    drop: job?.drop || 'Unknown Drop',
    status: job?.status || 'COMPLETED',
    date: job?.date || '2024-02-14',
    earnings: typeof job?.earnings === 'number' ? job.earnings : 0,
    distance: job?.distance || '0 km',
    eta: job?.eta || '0h 00m',
    paymentStatus: String(job?.paymentStatus || '').toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID',
  };
}

function formatEarnings(value) {
  if (typeof value !== 'number') {
    return 'INR 0';
  }
  return `INR ${value.toLocaleString('en-IN')}`;
}

function CompletedJobScreen({ navigation, route }) {
  const { colors, spacing, typography } = useAppTheme();
  const [job, setJob] = useState(route?.params?.job ? normalizeJob(route.params.job) : null);
  const [isLoading, setIsLoading] = useState(!route?.params?.job);

  useEffect(() => {
    let mounted = true;

    const loadJob = async () => {
      if (route?.params?.job) {
        setIsLoading(false);
        return;
      }

      try {
        const jobsRaw = await AsyncStorage.getItem(STORAGE_KEY);
        const jobs = parseStoredJson(jobsRaw, []);
        const foundJob = Array.isArray(jobs)
          ? jobs.find(item => item.id === route?.params?.jobId)
          : null;
        if (mounted && foundJob) {
          setJob(normalizeJob(foundJob));
        }
      } catch (_error) {
        if (mounted) {
          setJob(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadJob();
    return () => {
      mounted = false;
    };
  }, [route?.params?.job, route?.params?.jobId]);

  const timeline = useMemo(() => {
    const base = [
      'Trip assigned',
      'Pickup confirmed',
      'In transit',
      'Delivery confirmed',
      'Trip completed',
    ];
    if (job?.paymentStatus === 'PAID') {
      base.push('Payment marked by admin');
    } else {
      base.push('Payment pending admin settlement');
    }
    return base;
  }, [job?.paymentStatus]);

  return (
    <AppScreen>
      <AppHeader title="Trip Summary" subtitle="View-only lifecycle" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        {isLoading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : job ? (
          <>
            <AppCard style={{ marginBottom: spacing[1] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.h2, { color: colors.textPrimary }]}>{job.id}</Text>
                <AppBadge label={job.paymentStatus} />
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Pickup</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{job.pickup}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Drop</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{job.drop}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Date</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{job.date}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Earnings</Text>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{formatEarnings(job.earnings)}</Text>
            </AppCard>

            <AppCard style={{ marginBottom: spacing[1] }}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>Status Timeline</Text>
              {timeline.map(item => (
                <Text key={item} style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>• {item}</Text>
              ))}
            </AppCard>
          </>
        ) : (
          <AppCard>
            <Text style={[typography.body, { color: colors.textPrimary }]}>No trip found.</Text>
          </AppCard>
        )}

        <AppButton title="Return to Jobs" onPress={() => navigation.navigate('JobsMain')} style={{ marginTop: spacing[1] }} />
      </ScrollView>
    </AppScreen>
  );
}

export default CompletedJobScreen;
