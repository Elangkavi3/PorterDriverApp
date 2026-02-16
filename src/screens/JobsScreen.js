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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import FilterBottomSheet from '../components/FilterBottomSheet';
import JobCard from '../components/JobCard';

const STORAGE_KEYS = {
  jobsList: 'jobsList',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
};

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

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
    cancellationReason: 'Cancelled by owner due to route consolidation.',
  },
  {
    id: 'PD-48268',
    pickup: 'Mysore Warehouse',
    drop: 'Bangalore Depot',
    status: 'COMPLETED',
    date: '2024-02-11',
    earnings: 1900,
    distance: '150 km',
    eta: '2h 40m',
    cancellationReason: '',
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

function FilterIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" color={color}>
      <Line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function JobsScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [sheetRange, setSheetRange] = useState('TODAY');
  const [appliedRange, setAppliedRange] = useState(null);
  const [isOnline] = useState(false);

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
      if (statusFilter !== 'ALL' && job.status !== statusFilter) {
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
      if (job.status === 'COMPLETED') {
        navigation.navigate('CompletedJobScreen', { job, jobId: job.id });
        return;
      }
      navigation.navigate('CancelledJobScreen', { job, jobId: job.id });
    },
    [navigation],
  );

  const renderStatusChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipScroll}
    >
      {STATUS_FILTERS.map(item => {
        const isSelected = statusFilter === item;
        return (
          <TouchableOpacity
            key={item}
            activeOpacity={0.9}
            style={[styles.chip, isSelected ? styles.chipSelected : null]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
              {item.charAt(0)}{item.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {renderStatusChips()}
      {appliedRange ? (
        <Text style={styles.rangeIndicator}>Date Filter: {sheetRange.replace('_', ' ')}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      {!isOnline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>No Internet - Showing Cached Jobs</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.filterButton}
          onPress={() => setShowFilterSheet(true)}
        >
          <FilterIcon />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Jobs Available</Text>
            </View>
          }
          renderItem={({ item }) => <JobCard job={item} onPress={handleJobPress} />}
          showsVerticalScrollIndicator={false}
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
    paddingVertical: 9,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  listHeader: {
    marginBottom: 10,
  },
  chipScroll: {
    paddingBottom: 4,
  },
  chip: {
    alignItems: 'center',
    borderColor: '#374151',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 40,
    minWidth: 100,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  rangeIndicator: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
});

export default JobsScreen;
