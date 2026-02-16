import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE_KEY = 'driverProfile';

const COLORS = {
  background: '#111827',
  card: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  primary: '#2563EB',
  border: '#374151',
};

const FALLBACK_PROFILE = {
  completedTrips: 124,
  onTimePercentage: 96,
  rating: 4.8,
};

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function PerformanceScreen({ navigation }) {
  const [profile, setProfile] = useState(FALLBACK_PROFILE);

  useFocusEffect(
    useCallback(() => {
      async function loadProfile() {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const storedProfile = parseJSON(raw, null);
        if (storedProfile) {
          setProfile(storedProfile);
        }
      }

      loadProfile();
    }, []),
  );

  const metrics = useMemo(() => {
    const completed = Number(profile?.completedTrips || 0);
    const total = Number(profile?.totalTrips || completed + 8);
    const cancelled = Math.max(0, total - completed);
    const onTime = Number(profile?.onTimePercentage || 0);
    const rating = Number(profile?.rating || 0).toFixed(1);

    return [
      { label: 'Total Trips', value: total },
      { label: 'Completed Trips', value: completed },
      { label: 'Cancelled Trips', value: cancelled },
      { label: 'On-Time %', value: `${onTime}%` },
      { label: 'Average Rating', value: rating },
    ];
  }, [profile]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Performance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {metrics.map((item) => (
          <View key={item.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
          </View>
        ))}

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Performance</Text>
          <View style={styles.chartWrapper}>
            <View style={[styles.chartBar, styles.chartBarOne]} />
            <View style={[styles.chartBar, styles.chartBarTwo]} />
            <View style={[styles.chartBar, styles.chartBarThree]} />
            <View style={[styles.chartBar, styles.chartBarFour]} />
            <View style={[styles.chartBar, styles.chartBarFive]} />
            <View style={[styles.chartBar, styles.chartBarSix]} />
          </View>
          <Text style={styles.chartNote}>Chart placeholder</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  metricCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  chartCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    padding: 20,
    marginTop: 4,
  },
  chartTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  chartWrapper: {
    marginTop: 18,
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#172033',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    width: 18,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  chartBarOne: {
    height: 34,
  },
  chartBarTwo: {
    height: 54,
  },
  chartBarThree: {
    height: 72,
  },
  chartBarFour: {
    height: 48,
  },
  chartBarFive: {
    height: 60,
  },
  chartBarSix: {
    height: 40,
  },
  chartNote: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PerformanceScreen;
