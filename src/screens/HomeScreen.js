
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationIcon from '../assets/icons/NotificationIcon.svg';

const HOS_WARN = 480;
const HOS_BLOCK = 540;
const FASTAG_LOW = 500;

const KEYS = {
  homeState: 'homeState',
  walletBalance: 'walletBalance',
  walletTransactions: 'walletTransactions',
  fastagBalance: 'fastagBalance',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  jobsList: 'jobsList',
  driverDocuments: 'driverDocuments',
  dailyHealthCheckDate: 'dailyHealthCheckDate',
  vehicleInspectionDate: 'vehicleInspectionDate',
  lastCompletedTrip: 'lastCompletedTrip',
};

const STATUS_COLORS = {
  ASSIGNED: '#2563EB',
  ACTIVE: '#2563EB',
  EN_ROUTE: '#F59E0B',
  COMPLETED: '#16A34A',
  CANCELLED: '#DC2626',
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

function parseDate(value) {
  const parts = String(value || '').split('-').map(Number);
  if (parts.length !== 3) {
    return null;
  }
  const [y, m, d] = parts;
  if (!y || !m || !d) {
    return null;
  }
  const parsed = new Date(y, m - 1, d);
  if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatMoney(value) {
  const amount = Number.isFinite(value) ? value : 0;
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function formatTime(minutes) {
  const safe = minutes > 0 ? Math.floor(minutes) : 0;
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  return `Driving Time Today: ${hrs}h ${String(mins).padStart(2, '0')}m`;
}

function normalizeHomeState(state, currentDate) {
  const defaults = {
    isOnDuty: false,
    drivingMinutes: 0,
    isOffline: false,
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
    isOffline: Boolean(state.isOffline),
    isGpsDisabled: Boolean(state.isGpsDisabled),
    isAssignmentCancelled: Boolean(state.isAssignmentCancelled),
    dutyDate:
      typeof state.dutyDate === 'string' && state.dutyDate.length === 10
        ? state.dutyDate
        : currentDate,
  };
}

function normalizeTrip(trip) {
  if (!trip || typeof trip !== 'object') {
    return null;
  }
  if (!trip.id || !trip.pickup || !trip.drop) {
    return null;
  }
  return {
    id: String(trip.id),
    pickup: String(trip.pickup),
    drop: String(trip.drop),
    status: String(trip.status || 'ACTIVE').toUpperCase(),
    date: String(trip.date || todayStamp()),
    earnings: typeof trip.earnings === 'number' ? trip.earnings : 0,
    distance: String(trip.distance || '0 km'),
    eta: String(trip.eta || '0h 00m'),
    cancellationReason: String(trip.cancellationReason || ''),
  };
}

function normalizeTxn(txn) {
  if (!txn || typeof txn !== 'object') {
    return null;
  }
  return {
    id: String(txn.id || `TXN-${Date.now()}`),
    type: txn.type === 'DEBIT' ? 'DEBIT' : 'CREDIT',
    source: String(txn.source || 'Trip'),
    amount: typeof txn.amount === 'number' ? txn.amount : 0,
    status: ['SUCCESS', 'PENDING', 'FAILED'].includes(txn.status) ? txn.status : 'PENDING',
    date: String(txn.date || todayStamp()),
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

function walletFromTransactions(transactions) {
  return transactions.reduce((sum, txn) => {
    if (!txn || txn.status === 'FAILED') {
      return sum;
    }
    return txn.type === 'DEBIT' ? sum - txn.amount : sum + txn.amount;
  }, 0);
}

function todayCredits(transactions, date) {
  return transactions.reduce((sum, txn) => {
    if (!txn) {
      return sum;
    }
    if (txn.type === 'CREDIT' && txn.status === 'SUCCESS' && txn.date === date) {
      return sum + txn.amount;
    }
    return sum;
  }, 0);
}

function hasExpiredRequiredDocuments(documents) {
  if (!Array.isArray(documents)) {
    return false;
  }

  const requiredDocs = ['Driving License', 'Fitness Certificate', 'Medical Certificate'];

  return documents.some(document => {
    if (!requiredDocs.includes(document?.name)) {
      return false;
    }
    if (String(document?.status || '').toUpperCase() === 'EXPIRED') {
      return true;
    }
    const expiry = parseDate(document?.expiryDate);
    if (!expiry) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry < today;
  });
}

function normalizeLastDelivery(delivery) {
  if (!delivery || typeof delivery !== 'object') {
    return null;
  }
  if (!delivery.id || !delivery.completedAt) {
    return null;
  }
  return {
    id: String(delivery.id),
    drop: String(delivery.drop || 'Delivery Completed'),
    earnings: typeof delivery.earnings === 'number' ? delivery.earnings : 0,
    completedAt: String(delivery.completedAt),
  };
}

function dateSortDesc(a, b) {
  const first = parseDate(a?.date);
  const second = parseDate(b?.date);
  const firstMs = first ? first.getTime() : 0;
  const secondMs = second ? second.getTime() : 0;
  return secondMs - firstMs;
}

function deriveLastDelivery(stored, jobs, transactions) {
  const persisted = normalizeLastDelivery(stored);
  if (persisted) {
    return persisted;
  }

  const completedJobs = jobs.filter(job => job.status === 'COMPLETED').sort(dateSortDesc);
  if (completedJobs.length > 0) {
    const latestJob = completedJobs[0];
    return {
      id: latestJob.id,
      drop: latestJob.drop,
      earnings: latestJob.earnings,
      completedAt: `${latestJob.date} 18:40`,
    };
  }

  const tripCredits = transactions
    .filter(
      txn =>
        txn.type === 'CREDIT' &&
        txn.status === 'SUCCESS' &&
        String(txn.source || '').startsWith('Trip '),
    )
    .sort(dateSortDesc);

  if (tripCredits.length === 0) {
    return null;
  }

  const latestCredit = tripCredits[0];
  const tripId = String(latestCredit.source).replace('Trip ', '').trim() || 'Trip';
  return {
    id: tripId,
    drop: 'Delivery Completed',
    earnings: latestCredit.amount,
    completedAt: `${latestCredit.date} 18:40`,
  };
}

function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const [isOnDuty, setIsOnDuty] = useState(false);
  const [drivingMinutes, setDrivingMinutes] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [isGpsDisabled, setIsGpsDisabled] = useState(false);
  const [isAssignmentCancelled, setIsAssignmentCancelled] = useState(false);

  const [assignment, setAssignment] = useState(null);
  const [tripState, setTripState] = useState('IDLE');

  const [walletBalance, setWalletBalance] = useState(0);
  const [earnedToday, setEarnedToday] = useState(0);
  const [fastagBalance, setFastagBalance] = useState(1850);

  const [hasHealthCheckToday, setHasHealthCheckToday] = useState(false);
  const [hasVehicleInspectionToday, setHasVehicleInspectionToday] = useState(false);
  const [isDocumentExpired, setIsDocumentExpired] = useState(false);
  const [lastDelivery, setLastDelivery] = useState(null);

  const loadDashboard = useCallback(async () => {
    const today = todayStamp();

    try {
      const rows = await AsyncStorage.multiGet([
        KEYS.homeState,
        KEYS.walletBalance,
        KEYS.walletTransactions,
        KEYS.fastagBalance,
        KEYS.activeTrip,
        KEYS.tripState,
        KEYS.jobsList,
        KEYS.driverDocuments,
        KEYS.dailyHealthCheckDate,
        KEYS.vehicleInspectionDate,
        KEYS.lastCompletedTrip,
      ]);

      const data = Object.fromEntries(rows);
      const updates = [];

      const state = normalizeHomeState(parseJson(data[KEYS.homeState], null), today);
      if (state.dutyDate !== today) {
        state.dutyDate = today;
        state.drivingMinutes = 0;
      }
      if (state.drivingMinutes >= HOS_BLOCK) {
        state.isOnDuty = false;
      }

      const txList = parseJson(data[KEYS.walletTransactions], []);
      const transactions = Array.isArray(txList)
        ? txList.map(normalizeTxn).filter(Boolean)
        : [];

      const balanceRaw = Number(data[KEYS.walletBalance]);
      const balanceComputed = walletFromTransactions(transactions);
      const balance = Number.isFinite(balanceRaw)
        ? balanceRaw
        : balanceComputed > 0
          ? balanceComputed
          : 0;

      const earned = todayCredits(transactions, today);

      const fastagRaw = Number(data[KEYS.fastagBalance]);
      const fastag = Number.isFinite(fastagRaw) ? fastagRaw : 1850;

      const jobsRaw = parseJson(data[KEYS.jobsList], []);
      const jobs = Array.isArray(jobsRaw)
        ? jobsRaw.map(normalizeTrip).filter(Boolean)
        : [];

      const activeTripRawValue = data[KEYS.activeTrip];
      const rawActiveTrip = parseJson(activeTripRawValue, null);
      const activeTrip = normalizeTrip(rawActiveTrip);
      let nextTripState = readTripState(data[KEYS.tripState]);

      let activeAssignment = null;
      if (activeTrip && !['COMPLETED', 'CANCELLED'].includes(nextTripState)) {
        activeAssignment = { ...activeTrip, status: 'ACTIVE' };
      } else {
        activeAssignment = jobs.find(job => job.status === 'ACTIVE') || null;
      }

      if (!activeAssignment) {
        nextTripState = 'IDLE';
      } else if (!['ASSIGNED', 'ACTIVE', 'EN_ROUTE', 'CANCELLED'].includes(nextTripState)) {
        nextTripState = 'ASSIGNED';
      }

      const healthDone = data[KEYS.dailyHealthCheckDate] === today;
      const inspectionDone = data[KEYS.vehicleInspectionDate] === today;
      const docsExpired = hasExpiredRequiredDocuments(parseJson(data[KEYS.driverDocuments], []));
      const cancelledByOwner = state.isAssignmentCancelled || nextTripState === 'CANCELLED';

      const delivery = deriveLastDelivery(
        parseJson(data[KEYS.lastCompletedTrip], null),
        jobs,
        transactions,
      );

      setIsOnDuty(state.isOnDuty);
      setDrivingMinutes(state.drivingMinutes);
      setIsOffline(state.isOffline);
      setIsGpsDisabled(state.isGpsDisabled);
      setIsAssignmentCancelled(cancelledByOwner);
      setAssignment(activeAssignment);
      setTripState(nextTripState);
      setWalletBalance(balance > 0 ? balance : 0);
      setEarnedToday(earned > 0 ? earned : 0);
      setFastagBalance(fastag);
      setHasHealthCheckToday(healthDone);
      setHasVehicleInspectionToday(inspectionDone);
      setIsDocumentExpired(docsExpired);
      setLastDelivery(delivery);

      if (data[KEYS.homeState] === null) {
        updates.push([KEYS.homeState, JSON.stringify(state)]);
      }
      if (data[KEYS.walletTransactions] === null) {
        updates.push([KEYS.walletTransactions, JSON.stringify([])]);
      }
      if (data[KEYS.walletBalance] === null) {
        updates.push([KEYS.walletBalance, String(balance)]);
      }
      if (data[KEYS.fastagBalance] === null) {
        updates.push([KEYS.fastagBalance, String(fastag)]);
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
      if (activeTripRawValue && !activeTrip) {
        updates.push([KEYS.activeTrip, '']);
      }
      if (data[KEYS.lastCompletedTrip] === null && delivery) {
        updates.push([KEYS.lastCompletedTrip, JSON.stringify(delivery)]);
      }

      if (updates.length > 0) {
        await AsyncStorage.multiSet(updates);
      }
    } catch (_error) {
      setIsOnDuty(false);
      setDrivingMinutes(0);
      setIsOffline(false);
      setIsGpsDisabled(false);
      setIsAssignmentCancelled(false);
      setAssignment(null);
      setTripState('IDLE');
      setWalletBalance(0);
      setEarnedToday(0);
      setFastagBalance(1850);
      setHasHealthCheckToday(false);
      setHasVehicleInspectionToday(false);
      setIsDocumentExpired(false);
      setLastDelivery(null);
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
  }, [
    drivingMinutes,
    isAssignmentCancelled,
    isGpsDisabled,
    isOffline,
    isOnDuty,
    isReady,
  ]);

  useEffect(() => {
    if (isOnDuty && drivingMinutes >= HOS_BLOCK) {
      setIsOnDuty(false);
    }
  }, [drivingMinutes, isOnDuty]);

  const isHosWarning = drivingMinutes >= HOS_WARN && drivingMinutes < HOS_BLOCK;
  const isHosExceeded = drivingMinutes >= HOS_BLOCK;

  const assignmentStatus = isAssignmentCancelled
    ? 'CANCELLED'
    : tripState === 'IDLE'
      ? 'ASSIGNED'
      : tripState;

  const banners = useMemo(() => {
    const list = [];
    if (isOffline) {
      list.push({ id: 'offline', tone: 'neutral', text: 'No Internet - Showing cached operational data' });
    }
    if (isGpsDisabled) {
      list.push({ id: 'gps', tone: 'warning', text: 'GPS Disabled - Enable location for route tracking' });
    }
    if (!hasHealthCheckToday) {
      list.push({ id: 'health', tone: 'warning', text: 'Daily health check pending before On-Duty' });
    }
    if (assignment && !hasVehicleInspectionToday) {
      list.push({ id: 'inspection', tone: 'warning', text: 'Vehicle inspection required before first trip' });
    }
    if (isHosWarning) {
      list.push({ id: 'hos-warning', tone: 'warning', text: 'HOS Warning - Approaching legal driving limit' });
    }
    if (isHosExceeded) {
      list.push({ id: 'hos-block', tone: 'danger', text: 'HOS Exceeded - Trip operations blocked' });
    }
    if (isDocumentExpired) {
      list.push({ id: 'docs', tone: 'danger', text: 'Document expired - Duty and trip actions restricted' });
    }
    if (isAssignmentCancelled) {
      list.push({ id: 'cancelled', tone: 'danger', text: 'Assignment cancelled by owner' });
    }
    return list;
  }, [
    assignment,
    hasHealthCheckToday,
    hasVehicleInspectionToday,
    isAssignmentCancelled,
    isDocumentExpired,
    isGpsDisabled,
    isHosExceeded,
    isHosWarning,
    isOffline,
  ]);

  const onDutyAction = useCallback(() => {
    if (isOnDuty) {
      if (assignment && !isAssignmentCancelled) {
        Alert.alert('Action Restricted', 'Cannot go Off-Duty during an active assignment.');
        return;
      }
      setIsOnDuty(false);
      return;
    }

    if (isHosExceeded) {
      Alert.alert('Duty Blocked', 'HOS limit exceeded. End cycle before going On-Duty.');
      return;
    }

    if (!hasHealthCheckToday) {
      Alert.alert('Daily Health Check Required', 'Complete health check before starting duty.', [
        { text: 'Later', style: 'cancel' },
        { text: 'Open', onPress: () => navigation.navigate('DailyPreDutyHealth') },
      ]);
      return;
    }

    if (isDocumentExpired) {
      Alert.alert('Duty Blocked', 'Document expired. Update documents to start duty.', [
        { text: 'Close', style: 'cancel' },
        { text: 'View Documents', onPress: () => navigation.navigate('DocumentVault') },
      ]);
      return;
    }

    setIsOnDuty(true);
  }, [
    assignment,
    hasHealthCheckToday,
    isAssignmentCancelled,
    isDocumentExpired,
    isHosExceeded,
    isOnDuty,
    navigation,
  ]);

  const completeHealthCheck = useCallback(() => {
    setHasHealthCheckToday(true);
    AsyncStorage.setItem(KEYS.dailyHealthCheckDate, todayStamp()).catch(() => {});
    navigation.navigate('DailyPreDutyHealth');
  }, [navigation]);

  const completeInspection = useCallback(() => {
    setHasVehicleInspectionToday(true);
    AsyncStorage.setItem(KEYS.vehicleInspectionDate, todayStamp()).catch(() => {});
    navigation.navigate('VehicleInspection');
  }, [navigation]);

  const viewTrip = useCallback(async () => {
    if (!assignment) {
      return;
    }
    if (isAssignmentCancelled) {
      Alert.alert('Assignment Cancelled', 'No trip actions are available.');
      return;
    }
    if (isHosExceeded) {
      Alert.alert('Trip Blocked', 'HOS limit exceeded. Cannot continue trip.');
      return;
    }
    if (!hasVehicleInspectionToday) {
      Alert.alert('Vehicle Inspection Required', 'Complete vehicle inspection before first trip.');
      return;
    }

    try {
      await AsyncStorage.multiSet([
        [KEYS.activeTrip, JSON.stringify({ ...assignment, status: 'ACTIVE' })],
        [KEYS.tripState, assignmentStatus === 'EN_ROUTE' ? 'EN_ROUTE' : 'ASSIGNED'],
      ]);
    } catch (_error) {
      // Keep navigation available even when local write fails.
    }

    navigation.navigate('ActiveTrip', { trip: assignment, job: assignment });
  }, [
    assignment,
    assignmentStatus,
    hasVehicleInspectionToday,
    isAssignmentCancelled,
    isHosExceeded,
    navigation,
  ]);

  const viewWallet = useCallback(() => {
    navigation.getParent()?.navigate('Wallet');
  }, [navigation]);

  const viewTollLogs = useCallback(() => {
    Alert.alert('FASTag Logs', 'Toll logs module is under integration.');
  }, []);

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
      {banners.map(item => (
        <View
          key={item.id}
          style={[
            styles.banner,
            item.tone === 'warning'
              ? styles.bannerWarning
              : item.tone === 'danger'
                ? styles.bannerDanger
                : styles.bannerNeutral,
          ]}
        >
          <Text style={[styles.bannerText, item.tone === 'warning' ? styles.bannerWarningText : null]}>
            {item.text}
          </Text>
        </View>
      ))}

      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>DR</Text></View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubTitle}>Owner-Controlled Fleet</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.9}>
            <NotificationIcon width={18} height={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosButton} activeOpacity={0.9} onPress={() => navigation.navigate('SOSFullScreen')}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System State</Text>
          <View style={styles.controlRow}><Text style={styles.controlLabel}>Offline Mode</Text><Switch value={isOffline} onValueChange={setIsOffline} /></View>
          <View style={styles.controlRow}><Text style={styles.controlLabel}>GPS Disabled</Text><Switch value={isGpsDisabled} onValueChange={setIsGpsDisabled} /></View>
          <View style={styles.controlRow}><Text style={styles.controlLabel}>Owner Cancelled Assignment</Text><Switch value={isAssignmentCancelled} onValueChange={setIsAssignmentCancelled} /></View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Duty Status</Text>
            <Switch value={isOnDuty} onValueChange={onDutyAction} />
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isOnDuty ? styles.statusDotOn : styles.statusDotOff]} />
            <Text style={styles.statusText}>{isOnDuty ? 'On-Duty' : 'Off-Duty'}</Text>
          </View>
          <Text style={styles.secondaryText}>{isOnDuty ? 'Location tracking active' : 'Location tracking paused'}</Text>
          <Text style={styles.drivingTime}>{formatTime(drivingMinutes)}</Text>

          {isHosWarning ? (
            <View style={styles.warningStrip}><Text style={styles.warningStripText}>HOS warning: driver nearing legal limit.</Text></View>
          ) : null}
          {isHosExceeded ? (
            <View style={styles.dangerStrip}><Text style={styles.dangerStripText}>HOS exceeded: duty and trip actions blocked.</Text></View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={onDutyAction}>
            <Text style={styles.primaryButtonText}>{isOnDuty ? 'End Duty' : 'Start Duty'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Compliance</Text>
          <View style={styles.complianceRow}>
            <View>
              <Text style={styles.complianceTitle}>Daily Health Check</Text>
              <Text style={styles.complianceSubText}>Required before starting duty</Text>
            </View>
            <TouchableOpacity style={[styles.complianceButton, hasHealthCheckToday ? styles.complianceDone : null]} activeOpacity={0.9} onPress={completeHealthCheck}>
              <Text style={styles.complianceButtonText}>{hasHealthCheckToday ? 'Completed' : 'Complete'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.complianceRow}>
            <View>
              <Text style={styles.complianceTitle}>Vehicle Inspection</Text>
              <Text style={styles.complianceSubText}>Required before first trip</Text>
            </View>
            <TouchableOpacity style={[styles.complianceButton, hasVehicleInspectionToday ? styles.complianceDone : null]} activeOpacity={0.9} onPress={completeInspection}>
              <Text style={styles.complianceButtonText}>{hasVehicleInspectionToday ? 'Completed' : 'Complete'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!assignment ? (
          <View style={[styles.card, styles.emptyAssignmentCard]}>
            <View style={styles.truckIconBox}><Text style={styles.truckIconText}>TRK</Text></View>
            <Text style={styles.emptyTitle}>No Active Assignment</Text>
            <Text style={styles.secondaryText}>Waiting for owner dispatch</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.cardTitle}>Active Assignment</Text>
              <View style={[styles.assignmentBadge, { backgroundColor: STATUS_COLORS[assignmentStatus] || '#2563EB' }]}>
                <Text style={styles.assignmentBadgeText}>{assignmentStatus}</Text>
              </View>
            </View>
            <Text style={styles.routeLabel}>Job ID</Text><Text style={styles.routeText}>{assignment.id}</Text>
            <Text style={styles.routeLabel}>Pickup</Text><Text style={styles.routeText}>{assignment.pickup}</Text>
            <Text style={styles.routeLabel}>Drop</Text><Text style={styles.routeText}>{assignment.drop}</Text>
            <View style={styles.metricsRow}><Text style={styles.metricText}>Distance: {assignment.distance}</Text><Text style={styles.metricText}>ETA: {assignment.eta}</Text></View>
            <TouchableOpacity
              style={[styles.primaryButton, isAssignmentCancelled || isHosExceeded ? styles.primaryButtonDisabled : null]}
              disabled={isAssignmentCancelled || isHosExceeded}
              activeOpacity={0.9}
              onPress={viewTrip}
            >
              <Text style={styles.primaryButtonText}>View Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wallet Snapshot</Text>
          <View style={styles.walletRow}>
            <View style={styles.walletColumn}><Text style={styles.routeLabel}>Available Balance</Text><Text style={styles.amount}>{formatMoney(walletBalance)}</Text></View>
            <View style={styles.walletColumn}><Text style={styles.routeLabel}>Earned Today</Text><Text style={styles.amount}>{formatMoney(earnedToday)}</Text></View>
          </View>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={viewWallet}>
            <Text style={styles.primaryButtonText}>View Wallet</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>FASTag Status</Text>
          <Text style={styles.amount}>{formatMoney(fastagBalance)}</Text>
          <Text style={[styles.secondaryText, fastagBalance <= FASTAG_LOW ? styles.fastagLow : styles.fastagOk]}>
            {fastagBalance <= FASTAG_LOW ? 'Low balance - recharge required' : 'Sufficient balance'}
          </Text>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.9} onPress={viewTollLogs}>
            <Text style={styles.secondaryButtonText}>View Toll Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last Delivery</Text>
          {lastDelivery ? (
            <View>
              <Text style={styles.routeText}>{lastDelivery.drop}</Text>
              <Text style={styles.secondaryText}>Trip: {lastDelivery.id}</Text>
              <Text style={styles.secondaryText}>Completed: {lastDelivery.completedAt}</Text>
              <Text style={styles.secondaryText}>Earnings: {formatMoney(lastDelivery.earnings)}</Text>
            </View>
          ) : (
            <Text style={styles.secondaryText}>No completed delivery recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerNeutral: { backgroundColor: '#1F2937' },
  bannerWarning: { backgroundColor: '#F59E0B' },
  bannerDanger: { backgroundColor: '#DC2626' },
  bannerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  bannerWarningText: { color: '#111827' },

  header: { minHeight: 72, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  headerCenter: { flex: 1, paddingHorizontal: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  headerSubTitle: { marginTop: 2, color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sosButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  content: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    marginBottom: 10,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  controlRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },

  statusRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusDotOn: { backgroundColor: '#16A34A' },
  statusDotOff: { backgroundColor: '#DC2626' },
  statusText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryText: { marginTop: 8, color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  drivingTime: { marginTop: 12, color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  warningStrip: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  warningStripText: { color: '#111827', fontSize: 13, fontWeight: '700' },
  dangerStrip: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dangerStripText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonDisabled: { backgroundColor: '#374151' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  complianceRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  complianceTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  complianceSubText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  complianceButton: {
    minHeight: 42,
    minWidth: 108,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  complianceDone: { backgroundColor: '#16A34A' },
  complianceButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  emptyAssignmentCard: { minHeight: 210, alignItems: 'center', justifyContent: 'center' },
  truckIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  truckIconText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assignmentBadge: {
    minHeight: 30,
    minWidth: 106,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  assignmentBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  routeLabel: { marginTop: 10, color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  routeText: { marginTop: 2, color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  metricsRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  metricText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },

  walletRow: { flexDirection: 'row' },
  walletColumn: { flex: 1, marginRight: 8 },
  amount: { marginTop: 4, color: '#FFFFFF', fontSize: 23, fontWeight: '800' },

  fastagLow: { color: '#F59E0B' },
  fastagOk: { color: '#16A34A' },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default HomeScreen;
