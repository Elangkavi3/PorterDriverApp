import React, { useCallback, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEYS = {
  jobsList: 'jobsList',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
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

function normalizeJob(job) {
  return {
    id: job?.id || 'PD-00000',
    pickup: job?.pickup || 'Unknown Pickup',
    drop: job?.drop || 'Unknown Drop',
    status: job?.status || 'ACTIVE',
    date: job?.date || '2024-02-14',
    earnings: typeof job?.earnings === 'number' ? job.earnings : 0,
    distance: job?.distance || '0 km',
    eta: job?.eta || '0h 00m',
    cancellationReason: job?.cancellationReason || '',
  };
}

function formatEarnings(value) {
  if (typeof value !== 'number') {
    return 'INR 0';
  }
  return `INR ${value.toLocaleString('en-IN')}`;
}

function stringifyTripState(value) {
  if (!value) {
    return 'ASSIGNED';
  }
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'object' && value.status) {
    return String(value.status).toUpperCase();
  }
  return 'ASSIGNED';
}

function JobDetailScreen({ navigation, route }) {
  const [job, setJob] = useState(route?.params?.job ? normalizeJob(route.params.job) : null);
  const [tripState, setTripState] = useState('ASSIGNED');
  const [isLoading, setIsLoading] = useState(true);

  const routeJobId = route?.params?.jobId;

  const loadData = useCallback(async () => {
    try {
      const jobsRaw = await AsyncStorage.getItem(STORAGE_KEYS.jobsList);
      const jobs = parseStoredJson(jobsRaw, []);
      const jobsList = Array.isArray(jobs) ? jobs.map(normalizeJob) : [];

      const targetJob =
        jobsList.find(item => item.id === routeJobId) ||
        (route?.params?.job ? normalizeJob(route.params.job) : null) ||
        jobsList.find(item => item.status === 'ACTIVE') ||
        jobsList[0] ||
        null;

      setJob(targetJob);

      const tripStateRaw = await AsyncStorage.getItem(STORAGE_KEYS.tripState);
      const parsedTripState = parseStoredJson(tripStateRaw, tripStateRaw);
      setTripState(stringifyTripState(parsedTripState));
    } catch (_error) {
      setJob(route?.params?.job ? normalizeJob(route.params.job) : null);
      setTripState('ASSIGNED');
    } finally {
      setIsLoading(false);
    }
  }, [route?.params?.job, routeJobId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const canContinue = useMemo(() => job && job.status === 'ACTIVE', [job]);

  const navigateToActiveTrip = useCallback(() => {
    const routeNames = navigation.getState()?.routeNames || [];
    if (routeNames.includes('ActiveTripScreen')) {
      navigation.navigate('ActiveTripScreen');
      return;
    }
    navigation.navigate('ActiveTrip');
  }, [navigation]);

  const handleContinueTrip = useCallback(async () => {
    if (!canContinue || !job) {
      return;
    }

    try {
      const activeTripRaw = await AsyncStorage.getItem(STORAGE_KEYS.activeTrip);
      const activeTrip = parseStoredJson(activeTripRaw, null);

      if (!activeTrip) {
        const tripPayload = normalizeJob({ ...job, status: 'ACTIVE' });
        await AsyncStorage.setItem(STORAGE_KEYS.activeTrip, JSON.stringify(tripPayload));
      }

      await AsyncStorage.setItem(STORAGE_KEYS.tripState, 'EN_ROUTE');
      setTripState('EN_ROUTE');
      navigateToActiveTrip();
    } catch (_error) {
      navigateToActiveTrip();
    }
  }, [canContinue, job, navigateToActiveTrip]);

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Job Details</Text>

        {job ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Job ID</Text>
              <Text style={styles.value}>{job.id}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Pickup</Text>
              <Text style={styles.value}>{job.pickup}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Drop</Text>
              <Text style={styles.value}>{job.drop}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{job.distance}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ETA</Text>
              <Text style={styles.value}>{job.eta}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Earnings</Text>
              <Text style={styles.value}>{formatEarnings(job.earnings)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Lifecycle Status</Text>
              <View style={styles.lifecycleBadge}>
                <Text style={styles.lifecycleText}>{tripState}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No Jobs Available</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canContinue}
          style={[styles.continueButton, !canContinue ? styles.continueButtonDisabled : null]}
          onPress={handleContinueTrip}
        >
          <Text style={styles.continueButtonText}>Continue Trip</Text>
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
  loaderContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  screenTitle: {
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
  lifecycleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 999,
    marginTop: 4,
    minHeight: 30,
    minWidth: 130,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  lifecycleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
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
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#374151',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default JobDetailScreen;
