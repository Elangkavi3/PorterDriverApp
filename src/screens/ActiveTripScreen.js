import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import ExpenseModal from '../components/ExpenseModal';
import OTPModal from '../components/OTPModal';
import TripProgressBar from '../components/TripProgressBar';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import OperationalSOSButton from '../components/ui/OperationalSOSButton';
import { useAppTheme } from '../theme/ThemeProvider';
import { useOperations } from '../runtime/OperationsProvider';

const STORAGE_KEYS = {
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  jobsList: 'jobsList',
  tripExpenses: 'tripExpenses',
  homeState: 'homeState',
  lastCompletedTrip: 'lastCompletedTrip',
};

const STATE_ACTIONS = {
  ASSIGNED: { label: 'Start Pickup Drive', nextState: 'EN_ROUTE_PICKUP' },
  ACTIVE: { label: 'Start Pickup Drive', nextState: 'EN_ROUTE_PICKUP' },
  EN_ROUTE_PICKUP: { label: 'Mark Arrived Pickup', nextState: 'ARRIVED_PICKUP' },
  ARRIVED_PICKUP: { label: 'Verify Pickup OTP', otpMode: 'PICKUP' },
  PICKUP_CONFIRMED: { label: 'Start Transit', nextState: 'IN_TRANSIT' },
  IN_TRANSIT: { label: 'Mark Arrived Drop', nextState: 'ARRIVED_DROP' },
  ARRIVED_DROP: { label: 'Verify Delivery OTP', otpMode: 'DELIVERY' },
  DELIVERY_CONFIRMED: { label: 'Upload POD', podUpload: true, nextState: 'POD_UPLOADED' },
  POD_UPLOADED: { label: 'Complete Trip', complete: true },
};

const HOS_WARN_MINUTES = 480;
const HOS_BLOCK_MINUTES = 540;

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

function normalizeTrip(trip) {
  if (!trip || typeof trip !== 'object' || !trip.id || !trip.pickup || !trip.drop) {
    return null;
  }

  return {
    id: String(trip.id),
    pickup: String(trip.pickup),
    drop: String(trip.drop),
    status: String(trip.status || 'ACTIVE').toUpperCase(),
    date: String(trip.date || '2024-02-14'),
    earnings: typeof trip.earnings === 'number' ? trip.earnings : 0,
    distance: String(trip.distance || '0 km'),
    eta: String(trip.eta || '0h 00m'),
    cancellationReason: String(trip.cancellationReason || ''),
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

function getDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatAmount(amount) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `INR ${safeAmount.toLocaleString('en-IN')}`;
}

function summarizeExpenses(expenses, tripId) {
  if (!Array.isArray(expenses) || !tripId) {
    return { fuel: 0, toll: 0, total: 0 };
  }

  let fuel = 0;
  let toll = 0;

  expenses.forEach(item => {
    if (!item || item.tripId !== tripId) {
      return;
    }
    const amount = typeof item.amount === 'number' ? item.amount : 0;
    const category = String(item.category || '').toLowerCase();
    if (category === 'fuel') {
      fuel += amount;
      return;
    }
    if (category === 'toll') {
      toll += amount;
    }
  });

  return {
    fuel,
    toll,
    total: fuel + toll,
  };
}

function ActiveTripScreen({ navigation, route }) {
  const { colors, spacing, typography } = useAppTheme();
  const {
    isOffline,
    pendingActions,
    queueOperationalAction,
  } = useOperations();

  const [isLoading, setIsLoading] = useState(true);
  const [trip, setTrip] = useState(normalizeTrip(route?.params?.trip || route?.params?.job));
  const [tripState, setTripState] = useState('ASSIGNED');
  const [isGpsDisabled, setIsGpsDisabled] = useState(false);
  const [drivingMinutes, setDrivingMinutes] = useState(0);
  const [isCancelledByOwner, setIsCancelledByOwner] = useState(false);
  const [expenses, setExpenses] = useState({ fuel: 0, toll: 0, total: 0 });
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpMode, setOtpMode] = useState('PICKUP');

  const loadTrip = useCallback(async () => {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.activeTrip,
        STORAGE_KEYS.tripState,
        STORAGE_KEYS.homeState,
        STORAGE_KEYS.tripExpenses,
      ]);
      const dataMap = Object.fromEntries(values);

      const storedTripRaw = parseStoredJson(dataMap[STORAGE_KEYS.activeTrip], null);
      const storedTrip = normalizeTrip(storedTripRaw);
      const routeTrip = normalizeTrip(route?.params?.trip || route?.params?.job);
      const nextTrip = storedTrip || routeTrip;

      if (!nextTrip) {
        setTrip(null);
        setTripState('CANCELLED');
        setIsLoading(false);
        return;
      }

      const parsedState = parseTripState(dataMap[STORAGE_KEYS.tripState]);
      const homeState = parseStoredJson(dataMap[STORAGE_KEYS.homeState], {});
      const nextIsCancelled = Boolean(homeState?.isAssignmentCancelled) || parsedState === 'CANCELLED';

      const expensesRaw = parseStoredJson(dataMap[STORAGE_KEYS.tripExpenses], []);
      const expenseSummary = summarizeExpenses(expensesRaw, nextTrip.id);

      setTrip(nextTrip);
      setTripState(nextIsCancelled ? 'CANCELLED' : parsedState || 'ASSIGNED');
      setIsGpsDisabled(Boolean(homeState?.isGpsDisabled));
      setDrivingMinutes(typeof homeState?.drivingMinutes === 'number' ? homeState.drivingMinutes : 0);
      setIsCancelledByOwner(nextIsCancelled);
      setExpenses(expenseSummary);

      if (!storedTrip && routeTrip) {
        await AsyncStorage.setItem(STORAGE_KEYS.activeTrip, JSON.stringify(routeTrip));
      }
      if (storedTripRaw && !storedTrip) {
        await AsyncStorage.setItem(STORAGE_KEYS.activeTrip, '');
      }
    } catch (_error) {
      const fallbackTrip = normalizeTrip(route?.params?.trip || route?.params?.job);
      setTrip(fallbackTrip);
      setTripState('ASSIGNED');
      setIsGpsDisabled(false);
      setDrivingMinutes(0);
      setIsCancelledByOwner(false);
      setExpenses({ fuel: 0, toll: 0, total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [route?.params?.job, route?.params?.trip]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip]),
  );

  const isCompleted = tripState === 'COMPLETED';
  const isCancelled = tripState === 'CANCELLED' || isCancelledByOwner;
  const isHosWarning = drivingMinutes >= HOS_WARN_MINUTES && drivingMinutes < HOS_BLOCK_MINUTES;
  const isHosExceeded = drivingMinutes >= HOS_BLOCK_MINUTES;

  const currentAction = useMemo(() => {
    if (isCancelled || isCompleted) {
      return null;
    }
    return STATE_ACTIONS[tripState] || STATE_ACTIONS.ASSIGNED;
  }, [isCancelled, isCompleted, tripState]);

  const pendingTripActions = useMemo(() => {
    if (!trip?.id) {
      return [];
    }
    return pendingActions.filter(item => String(item?.payload?.tripId) === String(trip.id));
  }, [pendingActions, trip?.id]);

  const canQueueOfflineAction = useMemo(() => {
    if (!currentAction) {
      return false;
    }
    return (
      currentAction.nextState === 'ARRIVED_PICKUP' ||
      currentAction.otpMode === 'DELIVERY' ||
      Boolean(currentAction.podUpload)
    );
  }, [currentAction]);

  const bannerItems = useMemo(() => {
    const banners = [];

    if (isOffline) {
      banners.push({ id: 'offline', tone: 'warning', text: 'Offline mode active. Trip is read-only with queued actions.' });
    }
    if (pendingTripActions.length > 0) {
      banners.push({ id: 'sync', tone: 'warning', text: `${pendingTripActions.length} action(s) pending sync` });
    }
    if (isGpsDisabled) {
      banners.push({ id: 'gps', tone: 'warning', text: 'GPS disabled. Route tracking unavailable.' });
    }
    if (isHosExceeded) {
      banners.push({ id: 'hos', tone: 'critical', text: 'HOS exceeded. Operational actions restricted.' });
    } else if (isHosWarning) {
      banners.push({ id: 'hos-warning', tone: 'warning', text: 'HOS warning. Approaching legal threshold.' });
    }
    if (isCancelled) {
      banners.push({ id: 'cancelled', tone: 'critical', text: 'Trip cancelled by control room.' });
    }

    return banners;
  }, [isCancelled, isGpsDisabled, isHosExceeded, isHosWarning, isOffline, pendingTripActions.length]);

  const persistTripState = useCallback(
    async nextState => {
      if (!trip) {
        return;
      }

      const nextTrip = {
        ...trip,
        status:
          nextState === 'COMPLETED'
            ? 'COMPLETED'
            : nextState === 'CANCELLED'
              ? 'CANCELLED'
              : 'ACTIVE',
      };

      setTrip(nextTrip);
      setTripState(nextState);

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.tripState, nextState],
        [STORAGE_KEYS.activeTrip, JSON.stringify(nextTrip)],
      ]);
    },
    [trip],
  );

  const handleExpenseSave = useCallback(
    async expense => {
      if (!trip) {
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.tripExpenses);
        const currentExpenses = parseStoredJson(raw, []);
        const list = Array.isArray(currentExpenses) ? currentExpenses : [];
        const payload = {
          ...expense,
          tripId: trip.id,
        };
        const nextExpenses = [payload, ...list];

        await AsyncStorage.setItem(STORAGE_KEYS.tripExpenses, JSON.stringify(nextExpenses));
        setExpenses(summarizeExpenses(nextExpenses, trip.id));
      } catch (_error) {
        Alert.alert('Error', 'Unable to save expense right now.');
      } finally {
        setShowExpenseModal(false);
      }
    },
    [trip],
  );

  const queueForSync = useCallback(async (type, nextState, label) => {
    if (!trip?.id) {
      return;
    }

    await queueOperationalAction(type, {
      tripId: trip.id,
      nextState,
      label,
      queuedAt: new Date().toISOString(),
    });

    Alert.alert('Queued', `${label} stored as Pending Sync. It will auto-sync when network is restored.`);
  }, [queueOperationalAction, trip?.id]);

  const handleOTPConfirm = useCallback(async () => {
    try {
      if (isOffline) {
        const queuedState = otpMode === 'PICKUP' ? 'PICKUP_CONFIRMED' : 'DELIVERY_CONFIRMED';
        await queueForSync('OTP_VERIFICATION', queuedState, `OTP Verification (${otpMode})`);
        return;
      }

      if (otpMode === 'PICKUP') {
        await persistTripState('PICKUP_CONFIRMED');
      } else {
        await persistTripState('DELIVERY_CONFIRMED');
      }
    } catch (_error) {
      Alert.alert('Error', 'Unable to validate OTP right now.');
    } finally {
      setShowOtpModal(false);
    }
  }, [isOffline, otpMode, persistTripState, queueForSync]);

  const openDashboard = useCallback(() => {
    const firstParent = navigation.getParent();
    const rootParent = firstParent?.getParent();

    if (rootParent && rootParent.getState()?.routeNames?.includes('MainTabs')) {
      rootParent.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      return;
    }

    if (firstParent && firstParent.getState()?.routeNames?.includes('Home')) {
      firstParent.navigate('Home');
      return;
    }

    navigation.goBack();
  }, [navigation]);

  const handleCompleteTrip = useCallback(async () => {
    if (!trip) {
      return;
    }

    try {
      const data = await AsyncStorage.multiGet([STORAGE_KEYS.activeTrip, STORAGE_KEYS.jobsList]);
      const dataMap = Object.fromEntries(data);

      const activeTrip = normalizeTrip(parseStoredJson(dataMap[STORAGE_KEYS.activeTrip], trip));
      if (!activeTrip) {
        throw new Error('Missing active trip');
      }

      const updates = [];

      const parsedJobs = parseStoredJson(dataMap[STORAGE_KEYS.jobsList], []);
      if (Array.isArray(parsedJobs)) {
        const updatedJobs = parsedJobs.map(job =>
          job?.id === activeTrip.id
            ? { ...job, status: 'COMPLETED', paymentStatus: 'UNPAID' }
            : job,
        );
        const hasJob = updatedJobs.some(job => job?.id === activeTrip.id);
        const nextJobs = hasJob
          ? updatedJobs
          : [
              ...updatedJobs,
              {
                ...activeTrip,
                status: 'COMPLETED',
                paymentStatus: 'UNPAID',
              },
            ];
        updates.push([STORAGE_KEYS.jobsList, JSON.stringify(nextJobs)]);
      }

      const completionSummary = {
        id: activeTrip.id,
        drop: activeTrip.drop,
        earnings: activeTrip.earnings,
        completedAt: `${getDateStamp()} 18:40`,
      };

      updates.push([STORAGE_KEYS.lastCompletedTrip, JSON.stringify(completionSummary)]);
      updates.push([STORAGE_KEYS.tripState, 'COMPLETED']);
      updates.push([STORAGE_KEYS.activeTrip, '']);

      await AsyncStorage.multiSet(updates);

      setTripState('COMPLETED');
      setTrip({ ...activeTrip, status: 'COMPLETED', paymentStatus: 'UNPAID' });
    } catch (_error) {
      Alert.alert('Error', 'Unable to complete this trip right now.');
    }
  }, [trip]);

  const handlePrimaryAction = useCallback(async () => {
    if (!trip || !currentAction || isActionBusy) {
      return;
    }
    if (isCancelled) {
      return;
    }
    if (isHosExceeded && !currentAction.complete) {
      Alert.alert('Action Blocked', 'HOS exceeded. Resolve duty compliance first.');
      return;
    }

    if (isOffline) {
      if (currentAction.nextState === 'ARRIVED_PICKUP') {
        await queueForSync('TRIP_STATE_TRANSITION', 'ARRIVED_PICKUP', 'Arrived at Pickup');
        return;
      }

      if (currentAction.otpMode === 'DELIVERY') {
        await queueForSync('OTP_VERIFICATION', 'DELIVERY_CONFIRMED', 'Confirm Delivery');
        return;
      }

      if (currentAction.podUpload) {
        await queueForSync('POD_UPLOAD', currentAction.nextState || 'POD_UPLOADED', 'Upload POD');
        await queueForSync('TRIP_STATE_TRANSITION', currentAction.nextState || 'POD_UPLOADED', 'POD State');
        return;
      }

      Alert.alert('Offline Mode', 'This action requires network and cannot be submitted right now.');
      return;
    }

    setIsActionBusy(true);
    try {
      if (currentAction.otpMode) {
        setOtpMode(currentAction.otpMode);
        setShowOtpModal(true);
        return;
      }

      if (currentAction.podUpload) {
        Alert.alert('POD Uploaded', 'Proof of delivery placeholder captured.');
        await persistTripState(currentAction.nextState || 'POD_UPLOADED');
        return;
      }

      if (currentAction.complete) {
        await handleCompleteTrip();
        return;
      }

      if (currentAction.nextState) {
        await persistTripState(currentAction.nextState);
      }
    } catch (_error) {
      Alert.alert('Error', 'Unable to update trip state.');
    } finally {
      setIsActionBusy(false);
    }
  }, [
    currentAction,
    handleCompleteTrip,
    isActionBusy,
    isCancelled,
    isHosExceeded,
    isOffline,
    persistTripState,
    queueForSync,
    trip,
  ]);

  if (isLoading) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!trip) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <AppHeader title="Active Trip" subtitle="No active assignment" />
        <View style={{ paddingHorizontal: spacing[2] }}>
          <AppCard>
            <Text style={[typography.body, { color: colors.textPrimary }]}>No active trip found.</Text>
            <AppButton title="Return to Dashboard" onPress={openDashboard} style={{ marginTop: spacing[2] }} />
          </AppCard>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title="Active Trip" subtitle="State-driven execution" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        {bannerItems.map(item => (
          <View
            key={item.id}
            style={{
              backgroundColor: item.tone === 'critical' ? colors.critical : colors.warning,
              borderRadius: 16,
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1],
              marginBottom: spacing[1],
            }}
          >
            <Text style={[typography.caption, { color: '#FFFFFF' }]}>{item.text}</Text>
          </View>
        ))}

        <AppCard style={{ marginBottom: spacing[1] }}>
          <View style={styles.rowTop}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{trip.id}</Text>
            <View style={{ flexDirection: 'row', gap: spacing[1] }}>
              <AppBadge label={isCancelled ? 'CRITICAL' : isCompleted ? 'COMPLETED' : tripState} />
              {pendingTripActions.length > 0 ? <AppBadge label="Pending Sync" tone="warning" /> : null}
            </View>
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Pickup</Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{trip.pickup}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Drop</Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{trip.drop}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[2] }}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Distance: {trip.distance}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>ETA: {trip.eta}</Text>
          </View>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing[1] }]}>Trip Progress</Text>
          <TripProgressBar currentState={tripState} />
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <View style={styles.rowTop}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>HOS Monitoring</Text>
            <AppBadge
              label={isHosExceeded ? 'CRITICAL' : isHosWarning ? 'UNPAID' : 'COMPLETED'}
              tone={isHosExceeded ? 'critical' : isHosWarning ? 'warning' : 'success'}
            />
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>
            {Math.floor(drivingMinutes / 60)}h {String(drivingMinutes % 60).padStart(2, '0')}m
          </Text>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Trip Expenses</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Fuel: {formatAmount(expenses.fuel)}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>Toll: {formatAmount(expenses.toll)}</Text>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[1] }]}>Total: {formatAmount(expenses.total)}</Text>
          {!isCompleted && !isCancelled ? (
            <AppButton title="Add Expense" variant="secondary" onPress={() => setShowExpenseModal(true)} style={{ marginTop: spacing[2] }} />
          ) : null}
        </AppCard>

        {isCompleted ? (
          <AppButton title="Back to Dashboard" onPress={openDashboard} style={{ marginTop: spacing[1] }} />
        ) : null}

        {!isCompleted && !isCancelled && currentAction ? (
          <AppButton
            title={isActionBusy ? 'Processing...' : currentAction.label}
            onPress={handlePrimaryAction}
            disabled={
              (isActionBusy || isHosExceeded || isGpsDisabled || (isOffline && !canQueueOfflineAction)) &&
              !currentAction.complete
            }
            style={{ marginTop: spacing[1] }}
          />
        ) : null}
      </ScrollView>

      <ExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSave={handleExpenseSave}
      />

      <OTPModal
        visible={showOtpModal}
        title={otpMode === 'PICKUP' ? 'Pickup OTP Verification' : 'Delivery OTP Verification'}
        onClose={() => setShowOtpModal(false)}
        onConfirm={handleOTPConfirm}
      />

      <OperationalSOSButton onPress={() => navigation.navigate('SOSFullScreen')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default ActiveTripScreen;
