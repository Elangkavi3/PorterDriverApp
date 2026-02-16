import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    cancellationReason: job?.cancellationReason || '',
  };
}

function formatEarnings(value) {
  if (typeof value !== 'number') {
    return 'INR 0';
  }
  return `INR ${value.toLocaleString('en-IN')}`;
}

function CompletedJobScreen({ navigation, route }) {
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Completed Job</Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : job ? (
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
              <Text style={styles.label}>Total Distance</Text>
              <Text style={styles.value}>{job.distance}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>6h 10m</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Earnings</Text>
              <Text style={styles.value}>{formatEarnings(job.earnings)}</Text>
            </View>
            <View style={styles.expenseBlock}>
              <Text style={styles.expenseTitle}>Expense Breakdown</Text>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Fuel</Text>
                <Text style={styles.expenseValue}>INR 980</Text>
              </View>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Toll</Text>
                <Text style={styles.expenseValue}>INR 240</Text>
              </View>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Parking</Text>
                <Text style={styles.expenseValue}>INR 120</Text>
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
          style={styles.returnButton}
          onPress={() => navigation.navigate('JobsScreen')}
        >
          <Text style={styles.returnButtonText}>Return to Jobs</Text>
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
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
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
  expenseBlock: {
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
    padding: 12,
  },
  expenseTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expenseLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  expenseValue: {
    color: '#FFFFFF',
    fontSize: 14,
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
  returnButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CompletedJobScreen;
