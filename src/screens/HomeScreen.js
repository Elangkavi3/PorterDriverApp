import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import OperationalSOSButton from '../components/ui/OperationalSOSButton';
import { useAppTheme } from '../theme/ThemeProvider';
import { useOperations } from '../runtime/OperationsProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  VEHICLE_STATUS,
  getVehicleStatusLabel,
  getVehicleStatusTone,
  isNotRoadworthy,
  isRoadReady,
  normalizeVehicleStatus,
} from '../services/vehicleStatus';
import { summarizeRequiredDocuments } from '../services/documentVerification';

const HOS_BLOCK = 540;

const KEYS = {
  homeState: 'homeState',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  jobsList: 'jobsList',
  driverDocuments: 'driverDocuments',
  dailyHealthCheckDate: 'dailyHealthCheckDate',
  vehicleInspectionDate: 'vehicleInspectionDate',
  vehicleLastInspectionTime: 'vehicleLastInspectionTime',
  vehicleFuelLevel: 'vehicleFuelLevel',
  profile: 'driverProfile',
  healthClearanceStatus: 'healthClearanceStatus',
  healthAdminApproval: 'healthAdminApproval',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
  vehicleUnsafeReason: 'vehicleUnsafeReason',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function formatDateTimeLabel(value) {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not recorded';
  }

  const dd = `${date.getDate()}`.padStart(2, '0');
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = `${date.getHours()}`.padStart(2, '0');
  const min = `${date.getMinutes()}`.padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function normalizeTrip(trip) {
  if (!trip || typeof trip !== 'object' || !trip.id || !trip.pickup || !trip.drop) {
    return null;
  }
  return {
    id: String(trip.id),
    pickup: String(trip.pickup),
    drop: String(trip.drop),
    status: String(trip.status || 'ACTIVE').toUpperCase(),
    date: String(trip.date || todayStamp()),
    distance: String(trip.distance || '0 km'),
    eta: String(trip.eta || '0h 00m'),
  };
}

function readTripState(value) {
  const parsed = parseJson(value, value);
  if (typeof parsed === 'string') {
    return parsed.toUpperCase();
  }
  if (parsed && typeof parsed === 'object' && parsed.status) {
    return String(parsed.status).toUpperCase();
  }
  return 'ASSIGNED';
}

function normalizeHomeState(state, currentDate) {
  const defaults = {
    isOnDuty: false,
    drivingMinutes: 0,
    isGpsDisabled: false,
    isAssignmentCancelled: false,
    dutyDate: currentDate,
  };

  if (!state || typeof state !== 'object') {
    return defaults;
  }

  return {
    isOnDuty: Boolean(state.isOnDuty),
    drivingMinutes:
      typeof state.drivingMinutes === 'number' && state.drivingMinutes > 0
        ? Math.floor(state.drivingMinutes)
        : 0,
    isGpsDisabled: Boolean(state.isGpsDisabled),
    isAssignmentCancelled: Boolean(state.isAssignmentCancelled),
    dutyDate:
      typeof state.dutyDate === 'string' && state.dutyDate.length === 10
        ? state.dutyDate
        : currentDate,
  };
}

function formatTime(minutes) {
  const safe = minutes > 0 ? Math.floor(minutes) : 0;
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hrs}h ${String(mins).padStart(2, '0')}m today`;
}

function HomeScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const { isOffline } = useOperations();

  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const [driverName, setDriverName] = useState('Driver');
  const [vehicleType, setVehicleType] = useState('16ft Truck');
  const [vehicleNumber, setVehicleNumber] = useState('TN-01-AB-1048');
  const [vehicleFuelLevel, setVehicleFuelLevel] = useState('68%');
  const [lastInspectionTime, setLastInspectionTime] = useState('');

  const [isOnDuty, setIsOnDuty] = useState(false);
  const [drivingMinutes, setDrivingMinutes] = useState(0);
  const [isGpsDisabled, setIsGpsDisabled] = useState(false);
  const [isAssignmentCancelled, setIsAssignmentCancelled] = useState(false);

  const [assignment, setAssignment] = useState(null);
  const [tripState, setTripState] = useState('IDLE');

  const [hasHealthCheckToday, setHasHealthCheckToday] = useState(false);
  const [hasVehicleInspectionToday, setHasVehicleInspectionToday] = useState(false);
  const [hasMissingDocuments, setHasMissingDocuments] = useState(false);
  const [hasBlockingDocuments, setHasBlockingDocuments] = useState(false);
  const [isDocumentExpired, setIsDocumentExpired] = useState(false);
  const [hasExpiringDocuments, setHasExpiringDocuments] = useState(false);

  const [healthClearanceStatus, setHealthClearanceStatus] = useState('FIT');
  const [healthAdminApproval, setHealthAdminApproval] = useState('CLEARED');
  const [vehicleSafetyStatus, setVehicleSafetyStatus] = useState(VEHICLE_STATUS.INSPECTION_PENDING);
  const [vehicleUnsafeReason, setVehicleUnsafeReason] = useState('');
  const [upcomingTrips, setUpcomingTrips] = useState([]);

  const loadDashboard = useCallback(async () => {
    const today = todayStamp();

    try {
      const rows = await AsyncStorage.multiGet([
        KEYS.homeState,
        KEYS.activeTrip,
        KEYS.tripState,
        KEYS.jobsList,
        KEYS.driverDocuments,
        KEYS.dailyHealthCheckDate,
        KEYS.vehicleInspectionDate,
        KEYS.vehicleLastInspectionTime,
        KEYS.vehicleFuelLevel,
        KEYS.profile,
        KEYS.healthClearanceStatus,
        KEYS.healthAdminApproval,
        KEYS.vehicleSafetyStatus,
        KEYS.vehicleUnsafeReason,
      ]);

      const data = Object.fromEntries(rows);
      const updates = [];

      const profile = parseJson(data[KEYS.profile], {});
      setDriverName(String(profile?.name || 'Driver'));
      setVehicleType(String(profile?.vehicleType || '16ft Truck'));
      setVehicleNumber(String(profile?.vehicleNumber || 'TN-01-AB-1048'));

      const state = normalizeHomeState(parseJson(data[KEYS.homeState], null), today);
      if (state.dutyDate !== today) {
        state.dutyDate = today;
        state.drivingMinutes = 0;
      }
      if (state.drivingMinutes >= HOS_BLOCK) {
        state.isOnDuty = false;
      }

      const jobsRaw = parseJson(data[KEYS.jobsList], []);
      const jobs = Array.isArray(jobsRaw) ? jobsRaw.map(normalizeTrip).filter(Boolean) : [];

      const activeTrip = normalizeTrip(parseJson(data[KEYS.activeTrip], null));
      let nextTripState = readTripState(data[KEYS.tripState]);

      let activeAssignment = null;
      if (activeTrip && !['COMPLETED', 'CANCELLED'].includes(nextTripState)) {
        activeAssignment = { ...activeTrip, status: 'ACTIVE' };
      } else {
        activeAssignment =
          jobs.find(job => job.status === 'ACTIVE') ||
          jobs.find(job => job.status === 'ASSIGNED') ||
          null;
      }

      if (!activeAssignment) {
        nextTripState = 'IDLE';
      } else if (!['ASSIGNED', 'ACTIVE', 'EN_ROUTE', 'CANCELLED'].includes(nextTripState)) {
        nextTripState = 'ASSIGNED';
      }

      const healthDone = data[KEYS.dailyHealthCheckDate] === today;
      const inspectionDone = data[KEYS.vehicleInspectionDate] === today;
      const documents = parseJson(data[KEYS.driverDocuments], []);
      const documentSummary = summarizeRequiredDocuments(documents);
      const cancelledByOwner = state.isAssignmentCancelled || nextTripState === 'CANCELLED';

      const normalizedVehicleStatus = normalizeVehicleStatus(data[KEYS.vehicleSafetyStatus]);

      setIsOnDuty(state.isOnDuty);
      setDrivingMinutes(state.drivingMinutes);
      setIsGpsDisabled(state.isGpsDisabled);
      setIsAssignmentCancelled(cancelledByOwner);
      setAssignment(activeAssignment);
      setTripState(nextTripState);
      setHasHealthCheckToday(healthDone);
      setHasVehicleInspectionToday(inspectionDone);
      setHasMissingDocuments(documentSummary.hasMissing);
      setHasBlockingDocuments(documentSummary.hasBlocking);
      setIsDocumentExpired(documentSummary.hasExpired);
      setHasExpiringDocuments(documentSummary.hasExpiring);

      setHealthClearanceStatus(String(data[KEYS.healthClearanceStatus] || 'FIT').toUpperCase());
      setHealthAdminApproval(String(data[KEYS.healthAdminApproval] || 'CLEARED').toUpperCase());
      setVehicleSafetyStatus(normalizedVehicleStatus);
      setVehicleUnsafeReason(String(data[KEYS.vehicleUnsafeReason] || ''));
      setVehicleFuelLevel(String(data[KEYS.vehicleFuelLevel] || '68%'));
      setLastInspectionTime(String(data[KEYS.vehicleLastInspectionTime] || data[KEYS.vehicleInspectionDate] || ''));

      setUpcomingTrips(
        jobs
          .filter(job => job.status === 'ASSIGNED' && (!activeAssignment || job.id !== activeAssignment.id))
          .slice(0, 3),
      );

      if (data[KEYS.homeState] === null) {
        updates.push([KEYS.homeState, JSON.stringify(state)]);
      }
      if (data[KEYS.dailyHealthCheckDate] === null) {
        updates.push([KEYS.dailyHealthCheckDate, '']);
      }
      if (data[KEYS.vehicleInspectionDate] === null) {
        updates.push([KEYS.vehicleInspectionDate, '']);
      }
      if (data[KEYS.tripState] === null) {
        updates.push([KEYS.tripState, nextTripState]);
      }
      if (data[KEYS.healthClearanceStatus] === null) {
        updates.push([KEYS.healthClearanceStatus, 'FIT']);
      }
      if (data[KEYS.healthAdminApproval] === null) {
        updates.push([KEYS.healthAdminApproval, 'CLEARED']);
      }
      if (data[KEYS.vehicleSafetyStatus] === null) {
        updates.push([KEYS.vehicleSafetyStatus, VEHICLE_STATUS.INSPECTION_PENDING]);
      }
      if (data[KEYS.vehicleUnsafeReason] === null) {
        updates.push([KEYS.vehicleUnsafeReason, '']);
      }
      if (data[KEYS.vehicleFuelLevel] === null) {
        updates.push([KEYS.vehicleFuelLevel, '68%']);
      }

      if (updates.length > 0) {
        await AsyncStorage.multiSet(updates);
      }
    } catch (_error) {
      setIsOnDuty(false);
      setDrivingMinutes(0);
      setIsGpsDisabled(false);
      setIsAssignmentCancelled(false);
      setAssignment(null);
      setTripState('IDLE');
      setHasHealthCheckToday(false);
      setHasVehicleInspectionToday(false);
      setHasMissingDocuments(false);
      setHasBlockingDocuments(false);
      setIsDocumentExpired(false);
      setHasExpiringDocuments(false);
      setHealthClearanceStatus('FIT');
      setHealthAdminApproval('CLEARED');
      setVehicleSafetyStatus(VEHICLE_STATUS.INSPECTION_PENDING);
      setVehicleUnsafeReason('');
      setUpcomingTrips([]);
    } finally {
      setIsReady(true);
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  useEffect(() => {
    if (!isOnDuty) {
      return undefined;
    }
    const timer = setInterval(() => {
      setDrivingMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, [isOnDuty]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const payload = {
      isOnDuty,
      drivingMinutes,
      isOffline,
      isGpsDisabled,
      isAssignmentCancelled,
      dutyDate: todayStamp(),
    };
    AsyncStorage.setItem(KEYS.homeState, JSON.stringify(payload)).catch(() => {});
  }, [drivingMinutes, isAssignmentCancelled, isGpsDisabled, isOffline, isOnDuty, isReady]);

  useEffect(() => {
    if (isOnDuty && drivingMinutes >= HOS_BLOCK) {
      setIsOnDuty(false);
    }
  }, [drivingMinutes, isOnDuty]);

  const isHealthBlocked = healthClearanceStatus === 'UNFIT' && healthAdminApproval !== 'CLEARED';
  const effectiveVehicleStatus = useMemo(() => {
    if (isNotRoadworthy(vehicleSafetyStatus)) {
      return VEHICLE_STATUS.NOT_ROADWORTHY;
    }
    if (vehicleSafetyStatus === VEHICLE_STATUS.NEEDS_ATTENTION) {
      return VEHICLE_STATUS.NEEDS_ATTENTION;
    }
    if (hasVehicleInspectionToday && isRoadReady(vehicleSafetyStatus)) {
      return VEHICLE_STATUS.ROAD_READY;
    }
    return VEHICLE_STATUS.INSPECTION_PENDING;
  }, [hasVehicleInspectionToday, vehicleSafetyStatus]);

  const isVehicleBlocked = effectiveVehicleStatus === VEHICLE_STATUS.NOT_ROADWORTHY;
  const isVehicleReadyForTrip = effectiveVehicleStatus === VEHICLE_STATUS.ROAD_READY;

  useEffect(() => {
    if (isLoading || !isReady) {
      return;
    }

    if (isHealthBlocked) {
      navigation.navigate('NotFitForDuty');
      return;
    }

    if (isVehicleBlocked) {
      navigation.navigate('VehicleUnsafe');
      return;
    }

    if (!hasHealthCheckToday) {
      navigation.navigate('DailyPreDutyHealth');
      return;
    }

    if (assignment && !hasVehicleInspectionToday) {
      navigation.navigate('VehicleInspection', { vehicleNumber });
    }
  }, [
    assignment,
    hasHealthCheckToday,
    hasVehicleInspectionToday,
    isHealthBlocked,
    isLoading,
    isReady,
    isVehicleBlocked,
    navigation,
    vehicleNumber,
  ]);

  const isHosExceeded = drivingMinutes >= HOS_BLOCK;

  const assignmentStatus = isAssignmentCancelled
    ? 'CRITICAL'
    : tripState === 'IDLE'
      ? 'ACTIVE'
      : tripState;

  const openDocumentVerification = useCallback(() => {
    navigation.getParent()?.navigate('Profile', {
      screen: 'ProfileMain',
      params: { focusSection: 'documents' },
    });
  }, [navigation]);

  const blockingAlert = useMemo(() => {
    if (isHosExceeded) {
      return { tone: 'critical', text: t('dashboard.hosBlockedBanner') };
    }
    if (isHealthBlocked) {
      return { tone: 'critical', text: t('dashboard.notFitBanner') };
    }
    if (isVehicleBlocked) {
      return {
        tone: 'critical',
        text: `${t('dashboard.vehicleUnsafe')} ${vehicleUnsafeReason || t('dashboard.contactAdmin')}`,
      };
    }
    if (isDocumentExpired) {
      return { tone: 'critical', text: t('dashboard.complianceExpiredDocs') };
    }
    if (hasBlockingDocuments) {
      return { tone: 'critical', text: t('dashboard.docsRequiredInfo') };
    }
    return null;
  }, [
    hasBlockingDocuments,
    isDocumentExpired,
    isHealthBlocked,
    isHosExceeded,
    isVehicleBlocked,
    t,
    vehicleUnsafeReason,
  ]);

  const requiredActionAlert = useMemo(() => {
    if (hasExpiringDocuments) {
      return { tone: 'warning', text: t('dashboard.docsExpiringBanner') };
    }
    if (!hasHealthCheckToday || (assignment && !hasVehicleInspectionToday)) {
      return { tone: 'warning', text: t('dashboard.pendingComplianceBanner') };
    }
    return null;
  }, [
    assignment,
    hasExpiringDocuments,
    hasHealthCheckToday,
    hasVehicleInspectionToday,
    t,
  ]);

  const showInspectionStatusCard =
    Boolean(assignment) ||
    !hasVehicleInspectionToday ||
    effectiveVehicleStatus !== VEHICLE_STATUS.ROAD_READY;

  const onDutyAction = useCallback(() => {
    if (isOnDuty) {
      if (assignment && !isAssignmentCancelled) {
        Alert.alert(t('alerts.actionRestricted'), t('alerts.cannotGoOffline'));
        return;
      }
      setIsOnDuty(false);
      return;
    }

    if (isHosExceeded) {
      Alert.alert(t('alerts.dutyBlocked'), t('alerts.hosBlocked'));
      return;
    }

    if (isHealthBlocked) {
      Alert.alert(t('alerts.dutyBlocked'), t('alerts.notFit'));
      navigation.navigate('NotFitForDuty');
      return;
    }

    if (!hasHealthCheckToday) {
      Alert.alert(t('alerts.dailyHealthRequired'), t('alerts.dailyHealthMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('alerts.open'), onPress: () => navigation.navigate('DailyPreDutyHealth') },
      ]);
      return;
    }

    if (isVehicleBlocked) {
      Alert.alert(t('alerts.dutyBlocked'), t('dashboard.vehicleUnsafe'));
      navigation.navigate('VehicleUnsafe');
      return;
    }

    setIsOnDuty(true);
  }, [
    assignment,
    hasHealthCheckToday,
    isAssignmentCancelled,
    isHealthBlocked,
    isHosExceeded,
    isOnDuty,
    isVehicleBlocked,
    navigation,
    t,
  ]);

  const completeInspection = useCallback(() => {
    navigation.navigate('VehicleInspection', { vehicleNumber });
  }, [navigation, vehicleNumber]);

  const openDailyHealth = useCallback(() => {
    navigation.navigate('DailyPreDutyHealth');
  }, [navigation]);

  const viewTrip = useCallback(async () => {
    if (!assignment) {
      return;
    }
    if (isAssignmentCancelled) {
      Alert.alert(t('alerts.assignmentCancelledTitle'), t('alerts.assignmentCancelledMessage'));
      return;
    }
    if (isHosExceeded) {
      Alert.alert(t('alerts.tripBlocked'), t('alerts.tripHosBlocked'));
      return;
    }
    if (isHealthBlocked) {
      Alert.alert(t('alerts.tripBlocked'), t('alerts.notFit'));
      navigation.navigate('NotFitForDuty');
      return;
    }
    if (!isVehicleReadyForTrip) {
      Alert.alert(t('alerts.inspectionRequiredTitle'), t('alerts.inspectionRequiredMessage'));
      navigation.navigate('VehicleInspection', { vehicleNumber });
      return;
    }
    navigation.navigate('JobDetail', { job: assignment, jobId: assignment.id });
  }, [
    assignment,
    isAssignmentCancelled,
    isHealthBlocked,
    isHosExceeded,
    isVehicleReadyForTrip,
    navigation,
    t,
    vehicleNumber,
  ]);

  if (isLoading) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('dashboard.welcome', { name: driverName })} subtitle={t('dashboard.subtitle')} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={{ marginBottom: spacing[1] }}>
          <View style={styles.cardHeadRow}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('dashboard.todaysTrip')}</Text>
            {assignment ? (
              <AppBadge label={assignmentStatus} />
            ) : null}
          </View>
          {assignment ? (
            <>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.tripId')}</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{assignment.id}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.pickup')}</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{assignment.pickup}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.drop')}</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{assignment.drop}</Text>

              {isVehicleReadyForTrip ? (
                <AppButton
                  title={t('dashboard.startTrip')}
                  onPress={viewTrip}
                  disabled={isAssignmentCancelled || isHosExceeded || isHealthBlocked || isVehicleBlocked}
                  style={{ marginTop: spacing[2] }}
                />
              ) : (
                <AppButton
                  title={t('dashboard.inspectionRequiredButton')}
                  variant="secondary"
                  onPress={completeInspection}
                  style={{ marginTop: spacing[2] }}
                />
              )}
            </>
          ) : (
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}> 
              {t('dashboard.noTrip')}
            </Text>
          )}
        </AppCard>

        {blockingAlert ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.critical,
                borderRadius: 16,
                marginBottom: spacing[1],
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.textOnColor }]}>{blockingAlert.text}</Text>
          </View>
        ) : null}

        {!hasHealthCheckToday ? (
          <View
            style={{
              marginBottom: spacing[1],
              borderRadius: 16,
              backgroundColor: colors.warning,
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1],
            }}
          >
            <Text style={[typography.label, { color: colors.textOnColor }]}>
              {t('alerts.dailyHealthRequired')}
            </Text>
            <TouchableOpacity onPress={openDailyHealth} activeOpacity={0.9}>
              <Text style={[typography.caption, { color: colors.textOnColor, marginTop: spacing[1] }]}>
                {t('alerts.open')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showInspectionStatusCard ? (
          <AppCard style={{ marginBottom: spacing[1] }}>
            <View style={styles.cardHeadRow}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('dashboard.inspectionStatus')}</Text>
              <AppBadge
                label={getVehicleStatusLabel(effectiveVehicleStatus)}
                tone={getVehicleStatusTone(effectiveVehicleStatus)}
              />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}> 
              {effectiveVehicleStatus === VEHICLE_STATUS.ROAD_READY
                ? t('dashboard.inspectionCompleted')
                : effectiveVehicleStatus === VEHICLE_STATUS.NOT_ROADWORTHY
                  ? t('dashboard.vehicleUnsafe')
                  : t('dashboard.inspectionRequired')}
            </Text>
            {effectiveVehicleStatus !== VEHICLE_STATUS.ROAD_READY ? (
              <AppButton
                title={t('dashboard.completeInspection')}
                onPress={completeInspection}
                style={{ marginTop: spacing[2] }}
              />
            ) : null}
          </AppCard>
        ) : null}

        {hasMissingDocuments ? (
          <View
            style={{
              marginBottom: spacing[1],
              borderRadius: 16,
              backgroundColor: colors.warning,
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1],
            }}
          >
            <Text style={[typography.label, { color: colors.textOnColor }]}>
              {t('dashboard.docsPending')}
            </Text>
            <TouchableOpacity onPress={openDocumentVerification} activeOpacity={0.9}>
              <Text style={[typography.caption, { color: colors.textOnColor, marginTop: spacing[1] }]}>
                {t('common.uploadNow')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {requiredActionAlert ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.warning,
                borderRadius: 16,
                marginBottom: spacing[1],
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.textOnColor }]}>{requiredActionAlert.text}</Text>
          </View>
        ) : null}

        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('VehicleDetails')}>
          <AppCard style={{ marginBottom: spacing[1], minHeight: 120 }}>
            <View style={styles.cardHeadRow}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('dashboard.vehicleStatus')}</Text>
              <AppBadge
                label={getVehicleStatusLabel(effectiveVehicleStatus)}
                tone={getVehicleStatusTone(effectiveVehicleStatus)}
              />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.vehicleNumber')}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleNumber}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.vehicleType')}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleType}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.fuelLevel')}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleFuelLevel}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('dashboard.lastInspectionTime')}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{formatDateTimeLabel(lastInspectionTime)}</Text>
          </AppCard>
        </TouchableOpacity>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <View style={styles.cardHeadRow}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('dashboard.assignedVehicle')}</Text>
            <AppBadge label={isOnDuty ? 'ACTIVE' : 'CRITICAL'} />
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>{vehicleNumber}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{vehicleType}</Text>
          <View style={[styles.switchRow, { marginTop: spacing[2] }]}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>{t('dashboard.onlineOffline')}</Text>
            <Switch
              value={isOnDuty}
              onValueChange={onDutyAction}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textOnColor}
            />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{formatTime(drivingMinutes)}</Text>
        </AppCard>

        {upcomingTrips.length > 0 ? (
          <AppCard style={{ marginBottom: spacing[1] }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('dashboard.upcomingTrips')}</Text>
            {upcomingTrips.map(item => (
              <View
                key={item.id}
                style={{
                  marginTop: spacing[1],
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: spacing[1],
                }}
              >
                <Text style={[typography.label, { color: colors.textPrimary }]}>{item.id}</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}> 
                  {item.pickup} -> {item.drop}
                </Text>
                <Text style={[typography.caption, { color: colors.warning }]}>{t('dashboard.lockedTrips')}</Text>
              </View>
            ))}
          </AppCard>
        ) : null}

      </ScrollView>

      <OperationalSOSButton onPress={() => navigation.navigate('SOSFullScreen')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  banner: {
    borderWidth: 0,
  },
});

export default HomeScreen;
