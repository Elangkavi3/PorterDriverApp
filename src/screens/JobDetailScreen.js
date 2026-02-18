import React, { useCallback, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import OperationalSOSButton from '../components/ui/OperationalSOSButton';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { VEHICLE_STATUS, getVehicleStatusLabel, getVehicleStatusTone, normalizeVehicleStatus } from '../services/vehicleStatus';
import { summarizeRequiredDocuments } from '../services/documentVerification';

const STORAGE_KEYS = {
  jobsList: 'jobsList',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
  vehicleInspectionDate: 'vehicleInspectionDate',
  driverDocuments: 'driverDocuments',
  profile: 'driverProfile',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const [job, setJob] = useState(route?.params?.job ? normalizeJob(route.params.job) : null);
  const [tripState, setTripState] = useState('ASSIGNED');
  const [vehicleStatus, setVehicleStatus] = useState(VEHICLE_STATUS.INSPECTION_PENDING);
  const [isInspectionCompletedToday, setIsInspectionCompletedToday] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('TN-01-AB-1048');
  const [showDocumentWarning, setShowDocumentWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const routeJobId = route?.params?.jobId;

  const loadData = useCallback(async () => {
    try {
      const rows = await AsyncStorage.multiGet([
        STORAGE_KEYS.jobsList,
        STORAGE_KEYS.tripState,
        STORAGE_KEYS.vehicleSafetyStatus,
        STORAGE_KEYS.vehicleInspectionDate,
        STORAGE_KEYS.profile,
      ]);
      const data = Object.fromEntries(rows);

      const jobs = parseStoredJson(data[STORAGE_KEYS.jobsList], []);
      const jobsList = Array.isArray(jobs) ? jobs.map(normalizeJob) : [];

      const targetJob =
        jobsList.find(item => item.id === routeJobId) ||
        (route?.params?.job ? normalizeJob(route.params.job) : null) ||
        jobsList.find(item => item.status === 'ACTIVE' || item.status === 'ASSIGNED') ||
        jobsList[0] ||
        null;

      setJob(targetJob);

      const parsedTripState = parseStoredJson(data[STORAGE_KEYS.tripState], data[STORAGE_KEYS.tripState]);
      setTripState(stringifyTripState(parsedTripState));

      setVehicleStatus(normalizeVehicleStatus(data[STORAGE_KEYS.vehicleSafetyStatus]));
      setIsInspectionCompletedToday(data[STORAGE_KEYS.vehicleInspectionDate] === todayStamp());
      setShowDocumentWarning(false);

      const profile = parseStoredJson(data[STORAGE_KEYS.profile], {});
      setVehicleNumber(String(profile?.vehicleNumber || 'TN-01-AB-1048'));
    } catch (_error) {
      setJob(route?.params?.job ? normalizeJob(route.params.job) : null);
      setTripState('ASSIGNED');
      setVehicleStatus(VEHICLE_STATUS.INSPECTION_PENDING);
      setIsInspectionCompletedToday(false);
      setVehicleNumber('TN-01-AB-1048');
      setShowDocumentWarning(false);
    } finally {
      setIsLoading(false);
    }
  }, [route?.params?.job, routeJobId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const isVehicleUnsafe = vehicleStatus === VEHICLE_STATUS.NOT_ROADWORTHY;
  const canStartTrip = useMemo(
    () => job && (job.status === 'ACTIVE' || job.status === 'ASSIGNED') && isInspectionCompletedToday && vehicleStatus === VEHICLE_STATUS.ROAD_READY,
    [isInspectionCompletedToday, job, vehicleStatus],
  );

  const navigateToActiveTrip = useCallback(() => {
    navigation.navigate('ActiveTrip');
  }, [navigation]);

  const openDocumentVerification = useCallback(() => {
    navigation.getParent()?.navigate('Profile', {
      screen: 'ProfileMain',
      params: { focusSection: 'documents' },
    });
  }, [navigation]);

  const handleStartTrip = useCallback(async () => {
    if (!canStartTrip || !job) {
      return;
    }

    try {
      const docRows = await AsyncStorage.getItem(STORAGE_KEYS.driverDocuments);
      const docSummary = summarizeRequiredDocuments(parseStoredJson(docRows, []));
      if (docSummary.hasBlocking) {
        setShowDocumentWarning(true);
        return;
      }

      const activeTripRaw = await AsyncStorage.getItem(STORAGE_KEYS.activeTrip);
      const activeTrip = parseStoredJson(activeTripRaw, null);

      if (!activeTrip) {
        const tripPayload = normalizeJob({ ...job, status: 'ACTIVE' });
        await AsyncStorage.setItem(STORAGE_KEYS.activeTrip, JSON.stringify(tripPayload));
      }

      await AsyncStorage.setItem(STORAGE_KEYS.tripState, 'EN_ROUTE_PICKUP');
      setTripState('EN_ROUTE_PICKUP');
      navigateToActiveTrip();
    } catch (_error) {
      Alert.alert(t('trip.unableToStartTitle'), t('trip.unableToStartMessage'));
    }
  }, [canStartTrip, job, navigateToActiveTrip, t]);

  if (isLoading) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('trip.detailsTitle')} subtitle={t('trip.detailsSubtitle')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        {job ? (
          <AppCard>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{job.id}</Text>
              <AppBadge label={tripState} />
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[2] }]}>{t('trip.assignedVehicle')}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleNumber}</Text>
            <View style={{ marginTop: spacing[1] }}>
              <AppBadge label={getVehicleStatusLabel(vehicleStatus)} tone={getVehicleStatusTone(vehicleStatus)} />
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[2] }]}>{t('dashboard.pickup')}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{job.pickup}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.drop')}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{job.drop}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[2] }}>
              <View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('trip.distance')}</Text>
                <Text style={[typography.label, { color: colors.textPrimary }]}>{job.distance}</Text>
              </View>
              <View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('trip.eta')}</Text>
                <Text style={[typography.label, { color: colors.textPrimary }]}>{job.eta}</Text>
              </View>
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[2] }]}>{t('trip.payout')}</Text>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{formatEarnings(job.earnings)}</Text>
          </AppCard>
        ) : (
          <AppCard>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('trip.noJobs')}</Text>
          </AppCard>
        )}

        {isVehicleUnsafe ? (
          <View
            style={{
              marginTop: spacing[2],
              borderRadius: 16,
              backgroundColor: colors.critical,
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1],
            }}
          >
            <Text style={[typography.label, { color: colors.textOnColor }]}>{t('dashboard.vehicleUnsafe')}</Text>
          </View>
        ) : (
          <>
            <AppButton
              title={t('dashboard.startTrip')}
              onPress={handleStartTrip}
              disabled={!canStartTrip}
              style={{ marginTop: spacing[2] }}
            />
            {!isInspectionCompletedToday || vehicleStatus !== VEHICLE_STATUS.ROAD_READY ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('VehicleInspection', { vehicleNumber })}>
                <Text style={[typography.caption, { color: colors.warning, marginTop: spacing[1] }]}>{t('trip.completeInspectionWarning')}</Text>
              </TouchableOpacity>
            ) : null}

            {showDocumentWarning ? (
              <View
                style={{
                  marginTop: spacing[2],
                  borderRadius: 16,
                  backgroundColor: colors.warning,
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[1],
                }}
              >
                <Text style={[typography.label, { color: colors.textOnColor }]}>
                  {t('trip.requiredDocumentsWarning')}
                </Text>
                <AppButton
                  title={t('common.uploadDocuments')}
                  onPress={openDocumentVerification}
                  style={{ marginTop: spacing[1] }}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <OperationalSOSButton onPress={() => navigation.navigate('SOSFullScreen')} />
    </AppScreen>
  );
}

export default JobDetailScreen;
