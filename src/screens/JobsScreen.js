import React, { useCallback, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FilterBottomSheet from '../components/FilterBottomSheet';
import JobCard from '../components/JobCard';
import AppScreen from '../components/ui/AppScreen';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import OperationalSOSButton from '../components/ui/OperationalSOSButton';
import { useAppTheme } from '../theme/ThemeProvider';

const STORAGE_KEYS = {
  jobsList: 'jobsList',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
};

const STATUS_FILTERS = ['ACTIVE', 'COMPLETED', 'PAID', 'UNPAID'];

const MOCK_JOBS = [
  {
    id: 'PD-48271',
    pickup: 'Chennai Warehouse',
    drop: 'Bangalore Depot',
    status: 'ACTIVE',
    date: '2024-02-14',
    earnings: 3200,
    distance: '340 km',
    eta: '5h 30m',
    cancellationReason: '',
  },
  {
    id: 'PD-48270',
    pickup: 'Hyderabad Hub',
    drop: 'Pune Distribution Yard',
    status: 'COMPLETED',
    date: '2024-02-13',
    earnings: 2800,
    distance: '300 km',
    eta: '5h 00m',
    cancellationReason: '',
    paymentStatus: 'PAID',
  },
  {
    id: 'PD-48269',
    pickup: 'Coimbatore Terminal',
    drop: 'Salem Transfer Point',
    status: 'CANCELLED',
    date: '2024-02-12',
    earnings: 0,
    distance: '160 km',
    eta: '2h 50m',
    cancellationReason: '',
    paymentStatus: 'UNPAID',
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

function normalizeJob(job) {
  if (!job || typeof job !== 'object' || !job.id) {
    return null;
  }
  return {
    id: String(job.id),
    pickup: String(job.pickup || 'Unknown Pickup'),
    drop: String(job.drop || 'Unknown Drop'),
    status: ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(
      String(job.status || '').toUpperCase(),
    )
      ? String(job.status).toUpperCase()
      : 'ACTIVE',
    date: String(job.date || '2024-02-14'),
    earnings: typeof job.earnings === 'number' ? job.earnings : 0,
    distance: String(job.distance || '0 km'),
    eta: String(job.eta || '0h 00m'),
    cancellationReason: String(job.cancellationReason || ''),
    paymentStatus:
      String(job?.paymentStatus || '').toUpperCase() === 'PAID'
        ? 'PAID'
        : 'UNPAID',
  };
}

function parseTripState(rawState) {
  const parsed = parseStoredJson(rawState, rawState);
  if (typeof parsed === 'string') {
    return parsed.toUpperCase();
  }
  if (parsed && typeof parsed === 'object' && parsed.status) {
    return String(parsed.status).toUpperCase();
  }
  return 'ASSIGNED';
}

function deriveStatusFromTripState(tripState) {
  if (tripState === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (tripState === 'CANCELLED') {
    return 'CANCELLED';
  }
  return 'ACTIVE';
}

function matchesStatusFilter(job, filter) {
  if (filter === 'ACTIVE') {
    return job.status === 'ACTIVE';
  }
  if (filter === 'COMPLETED') {
    return job.status === 'COMPLETED';
  }
  if (filter === 'PAID') {
    return job.status === 'COMPLETED' && job.paymentStatus === 'PAID';
  }
  if (filter === 'UNPAID') {
    return job.status === 'COMPLETED' && job.paymentStatus !== 'PAID';
  }
  return true;
}

function toTimeStart(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isInDateRange(jobDate, range) {
  if (!range) {
    return true;
  }

  const parsedDate = parseDate(jobDate);
  if (!parsedDate) {
    return false;
  }

  const today = toTimeStart(new Date());
  const targetDate = toTimeStart(parsedDate);

  if (range === 'TODAY') {
    return targetDate.getTime() === today.getTime();
  }

  if (range === 'THIS_WEEK') {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekStart = toTimeStart(startOfWeek);
    return targetDate >= weekStart && targetDate <= today;
  }

  if (range === 'THIS_MONTH') {
    return (
      targetDate.getFullYear() === today.getFullYear() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate <= today
    );
  }

  return true;
}

function JobsScreen({ navigation }) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [sheetRange, setSheetRange] = useState('TODAY');
  const [appliedRange, setAppliedRange] = useState(null);

  const loadJobs = useCallback(async () => {
    try {
      const rows = await AsyncStorage.multiGet([
        STORAGE_KEYS.jobsList,
        STORAGE_KEYS.activeTrip,
        STORAGE_KEYS.tripState,
      ]);
      const data = Object.fromEntries(rows);
      const updates = [];

      const parsedJobs = parseStoredJson(data[STORAGE_KEYS.jobsList], null);
      const baseJobs = Array.isArray(parsedJobs)
        ? parsedJobs.map(normalizeJob).filter(Boolean)
        : MOCK_JOBS.map(normalizeJob).filter(Boolean);

      if (!Array.isArray(parsedJobs)) {
        updates.push([STORAGE_KEYS.jobsList, JSON.stringify(baseJobs)]);
      }

      const activeTrip = normalizeJob(parseStoredJson(data[STORAGE_KEYS.activeTrip], null));
      const tripState = parseTripState(data[STORAGE_KEYS.tripState]);
      let nextJobs = baseJobs;

      if (activeTrip) {
        const activeStatus = deriveStatusFromTripState(tripState);
        const normalizedActiveTrip = {
          ...activeTrip,
          status: activeStatus,
          paymentStatus: 'UNPAID',
        };

        if (!nextJobs.some(job => job.id === normalizedActiveTrip.id)) {
          nextJobs = [normalizedActiveTrip, ...nextJobs];
          updates.push([STORAGE_KEYS.jobsList, JSON.stringify(nextJobs)]);
        }
      }

      if (updates.length > 0) {
        await AsyncStorage.multiSet(updates);
      }

      setJobs(nextJobs);
    } catch (_error) {
      setJobs(MOCK_JOBS.map(normalizeJob).filter(Boolean));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs]),
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!matchesStatusFilter(job, statusFilter)) {
        return false;
      }
      return isInDateRange(job.date, appliedRange);
    });
  }, [appliedRange, jobs, statusFilter]);

  const handleJobPress = useCallback(
    job => {
      if (job.status === 'ACTIVE') {
        navigation.navigate('JobDetailScreen', { job, jobId: job.id });
        return;
      }
      navigation.navigate('CompletedJobScreen', { job, jobId: job.id });
    },
    [navigation],
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title="Jobs" subtitle="Dispatch queue and lifecycle" />

      <View style={{ paddingHorizontal: spacing[2], paddingBottom: spacing[2] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[1] }}>
          {STATUS_FILTERS.map(item => {
            const isSelected = statusFilter === item;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.9}
                style={{
                  minHeight: spacing[6],
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  justifyContent: 'center',
                  paddingHorizontal: spacing[2],
                }}
                onPress={() => setStatusFilter(item)}
              >
                <Text style={[typography.label, { color: '#FFFFFF' }]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: spacing[1] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowFilterSheet(true)}
            style={{
              minHeight: spacing[6],
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              justifyContent: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>Date Filter</Text>
          </TouchableOpacity>
        </View>

        {appliedRange ? (
          <View style={{ marginTop: spacing[1] }}>
            <AppBadge label={sheetRange.replace('_', ' ')} tone="active" />
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={{ paddingHorizontal: spacing[2] }}>
          <AppCard>
            <Text style={[typography.body, { color: colors.textPrimary }]}>No jobs found</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Adjust status or date filters.</Text>
          </AppCard>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <JobCard job={item} onPress={handleJobPress} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}
        />
      )}

      <FilterBottomSheet
        visible={showFilterSheet}
        selectedRange={sheetRange}
        onSelectRange={setSheetRange}
        onApply={() => {
          setAppliedRange(sheetRange);
          setShowFilterSheet(false);
        }}
        onClose={() => setShowFilterSheet(false)}
      />

      <OperationalSOSButton onPress={() => navigation.navigate('SOSFullScreen')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default JobsScreen;
