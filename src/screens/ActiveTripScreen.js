import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExpenseModal from '../components/ExpenseModal';
import OTPModal from '../components/OTPModal';
import TripProgressBar from '../components/TripProgressBar';
import CancelIcon from '../components/icons/CancelIcon';
import ClockIcon from '../components/icons/ClockIcon';
import FuelIcon from '../components/icons/FuelIcon';
import LocationIcon from '../components/icons/LocationIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import SOSIcon from '../components/icons/SOSIcon';
import SuccessIcon from '../components/icons/SuccessIcon';
import TollIcon from '../components/icons/TollIcon';
import TruckIcon from '../components/icons/TruckIcon';
import WarningIcon from '../components/icons/WarningIcon';

const STORAGE_KEYS = {
  walletBalance: 'walletBalance',
  walletTransactions: 'walletTransactions',
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
  DELIVERY_CONFIRMED: { label: 'Complete Trip', complete: true },
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
    date: String(trip.date || '2024-02-14'),
    earnings: typeof trip.earnings === 'number' ? trip.earnings : 0,
    distance: String(trip.distance || '0 km'),
    eta: String(trip.eta || '0h 00m'),
    cancellationReason: String(trip.cancellationReason || ''),
  };
}

function normalizeTransaction(transaction) {
  return {
    id: transaction?.id || `TXN-${Date.now()}`,
    type: transaction?.type === 'DEBIT' ? 'DEBIT' : 'CREDIT',
    source: transaction?.source || 'Trip',
    amount: typeof transaction?.amount === 'number' ? transaction.amount : 0,
    status: ['SUCCESS', 'PENDING', 'FAILED'].includes(transaction?.status)
      ? transaction.status
      : 'PENDING',
    date: transaction?.date || '2024-02-14',
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

function formatDrivingTime(minutes) {
  const safeMinutes = minutes > 0 ? minutes : 0;
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
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
  const [isLoading, setIsLoading] = useState(true);
  const [trip, setTrip] = useState(normalizeTrip(route?.params?.trip || route?.params?.job));
  const [tripState, setTripState] = useState('ASSIGNED');
  const [isOffline, setIsOffline] = useState(false);
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
      setIsOffline(Boolean(homeState?.isOffline));
      setIsGpsDisabled(Boolean(homeState?.isGpsDisabled));
      setDrivingMinutes(
        typeof homeState?.drivingMinutes === 'number' ? homeState.drivingMinutes : 0,
      );
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
      setIsOffline(false);
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

  const bannerItems = useMemo(() => {
    const banners = [];

    if (isOffline) {
      banners.push({
        id: 'offline',
        type: 'warning',
        text: 'No Internet - Trip data is running in cached mode',
      });
    }
    if (isGpsDisabled) {
      banners.push({
        id: 'gps',
        type: 'warning',
        text: 'GPS Disabled - Route tracking signal unavailable',
      });
    }
    if (isHosExceeded) {
      banners.push({
        id: 'hos',
        type: 'warning',
        text: 'HOS Exceeded - Operational actions restricted',
      });
    } else if (isHosWarning) {
      banners.push({
        id: 'hos-warning',
        type: 'warning',
        text: 'HOS Warning - Near legal driving threshold',
      });
    }
    if (isCancelled) {
      banners.push({
        id: 'cancelled',
        type: 'cancel',
        text: 'Trip cancelled by owner control room',
      });
    }

    return banners;
  }, [isCancelled, isGpsDisabled, isHosExceeded, isHosWarning, isOffline]);

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

        await AsyncStorage.setItem(
          STORAGE_KEYS.tripExpenses,
          JSON.stringify(nextExpenses),
        );
        setExpenses(summarizeExpenses(nextExpenses, trip.id));
      } catch (_error) {
        Alert.alert('Error', 'Unable to save expense right now.');
      } finally {
        setShowExpenseModal(false);
      }
    },
    [trip],
  );

  const handleOTPConfirm = useCallback(
    async () => {
      try {
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
    },
    [otpMode, persistTripState],
  );

  const handleCompleteTrip = useCallback(async () => {
    if (!trip) {
      return;
    }

    try {
      const data = await AsyncStorage.multiGet([
        STORAGE_KEYS.walletBalance,
        STORAGE_KEYS.walletTransactions,
        STORAGE_KEYS.activeTrip,
        STORAGE_KEYS.jobsList,
        STORAGE_KEYS.tripExpenses,
      ]);
      const dataMap = Object.fromEntries(data);

      const activeTrip = normalizeTrip(
        parseStoredJson(dataMap[STORAGE_KEYS.activeTrip], trip),
      );
      if (!activeTrip) {
        throw new Error('Missing active trip');
      }

      const walletBalance = Number(dataMap[STORAGE_KEYS.walletBalance]);
      const currentBalance = Number.isFinite(walletBalance) ? walletBalance : 0;

      const parsedTransactions = parseStoredJson(
        dataMap[STORAGE_KEYS.walletTransactions],
        [],
      );
      const transactions = Array.isArray(parsedTransactions)
        ? parsedTransactions.map(normalizeTransaction)
        : [];

      const tripSource = `Trip ${activeTrip.id}`;
      const alreadyCredited = transactions.some(
        transaction =>
          transaction.type === 'CREDIT' &&
          transaction.source === tripSource &&
          transaction.status === 'SUCCESS',
      );

      const updates = [];

      if (!alreadyCredited) {
        const creditTransaction = {
          id: `TXN-${Date.now()}`,
          type: 'CREDIT',
          source: tripSource,
          amount: activeTrip.earnings,
          status: 'SUCCESS',
          date: getDateStamp(),
        };

        const nextTransactions = [creditTransaction, ...transactions];
        const nextBalance = currentBalance + activeTrip.earnings;

        updates.push([
          STORAGE_KEYS.walletTransactions,
          JSON.stringify(nextTransactions),
        ]);
        updates.push([STORAGE_KEYS.walletBalance, String(nextBalance)]);
      }

      const parsedJobs = parseStoredJson(dataMap[STORAGE_KEYS.jobsList], []);
      if (Array.isArray(parsedJobs)) {
        const nextJobs = parsedJobs.map(job =>
          job?.id === activeTrip.id ? { ...job, status: 'COMPLETED' } : job,
        );
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
      setTrip({ ...activeTrip, status: 'COMPLETED' });
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

    setIsActionBusy(true);
    try {
      if (currentAction.otpMode) {
        setOtpMode(currentAction.otpMode);
        setShowOtpModal(true);
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
    persistTripState,
    trip,
  ]);

  const routeBackToHome = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.emptyState}>
          <TruckIcon size={32} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButton}
            onPress={routeBackToHome}
          >
            <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      {bannerItems.map(item => {
        const isWarning = item.type === 'warning';
        return (
          <View
            key={item.id}
            style={[
              styles.banner,
              isWarning ? styles.warningBanner : styles.cancelBanner,
            ]}
          >
            {isWarning ? (
              <WarningIcon size={16} color={isWarning ? '#111827' : '#FFFFFF'} />
            ) : (
              <CancelIcon size={16} color="#FFFFFF" />
            )}
            <Text
              style={[
                styles.bannerText,
                isWarning ? styles.warningBannerText : null,
              ]}
            >
              {item.text}
            </Text>
          </View>
        );
      })}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Trip</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.sosButton}
          onPress={() => navigation.navigate('SOSFullScreen')}
        >
          <SOSIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.tripHeaderRow}>
            <View style={styles.tripIdRow}>
              <TruckIcon size={20} color="#FFFFFF" />
              <Text style={styles.tripId}>{trip.id}</Text>
            </View>
            <View
              style={[
                styles.stateBadge,
                isCancelled
                  ? styles.stateBadgeDanger
                  : isCompleted
                    ? styles.stateBadgeSuccess
                    : styles.stateBadgePrimary,
              ]}
            >
              <Text style={styles.stateBadgeText}>
                {isCancelled ? 'CANCELLED' : tripState}
              </Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <LocationIcon size={18} color="#9CA3AF" />
            <View style={styles.routeTextGroup}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeValue}>{trip.pickup}</Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <MapPinIcon size={18} color="#9CA3AF" />
            <View style={styles.routeTextGroup}>
              <Text style={styles.routeLabel}>Drop</Text>
              <Text style={styles.routeValue}>{trip.drop}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Distance: {trip.distance}</Text>
            <Text style={styles.metaText}>ETA: {trip.eta}</Text>
          </View>
          <Text style={styles.earningsText}>Expected Earnings: {formatAmount(trip.earnings)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Progress</Text>
          <TripProgressBar currentState={tripState} />
        </View>

        <View style={styles.card}>
          <View style={styles.hosHeader}>
            <ClockIcon size={18} color="#9CA3AF" />
            <Text style={styles.cardTitle}>HOS Monitoring</Text>
          </View>
          <Text style={styles.hosValue}>{formatDrivingTime(drivingMinutes)}</Text>
          <Text
            style={[
              styles.hosNote,
              isHosExceeded
                ? styles.hosCritical
                : isHosWarning
                  ? styles.hosWarning
                  : null,
            ]}
          >
            {isHosExceeded
              ? 'Exceeded legal limit'
              : isHosWarning
                ? 'Approaching legal limit'
                : 'Within legal limit'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Expenses</Text>

          <View style={styles.expenseRow}>
            <View style={styles.expenseLabelRow}>
              <FuelIcon size={17} color="#9CA3AF" />
              <Text style={styles.expenseLabel}>Fuel</Text>
            </View>
            <Text style={styles.expenseValue}>{formatAmount(expenses.fuel)}</Text>
          </View>

          <View style={styles.expenseRow}>
            <View style={styles.expenseLabelRow}>
              <TollIcon size={17} color="#9CA3AF" />
              <Text style={styles.expenseLabel}>Toll</Text>
            </View>
            <Text style={styles.expenseValue}>{formatAmount(expenses.toll)}</Text>
          </View>

          <View style={[styles.expenseRow, styles.expenseTotalRow]}>
            <Text style={styles.expenseTotalLabel}>Total Logged</Text>
            <Text style={styles.expenseTotalValue}>{formatAmount(expenses.total)}</Text>
          </View>

          {!isCompleted && !isCancelled ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.secondaryButton}
              onPress={() => setShowExpenseModal(true)}
            >
              <Text style={styles.secondaryButtonText}>Add Expense</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isCompleted ? (
          <View style={styles.resultCard}>
            <SuccessIcon size={24} color="#16A34A" />
            <Text style={styles.resultTitle}>Trip Completed</Text>
            <Text style={styles.resultText}>
              Credit posted for {formatAmount(trip.earnings)}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryButton}
              onPress={routeBackToHome}
            >
              <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isCancelled ? (
          <View style={styles.resultCard}>
            <CancelIcon size={24} color="#DC2626" />
            <Text style={styles.resultTitle}>Trip Cancelled</Text>
            <Text style={styles.resultText}>
              {trip.cancellationReason || 'Cancelled by owner control room.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryButton}
              onPress={routeBackToHome}
            >
              <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isCompleted && !isCancelled && currentAction ? (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.primaryButton,
              (isActionBusy || isHosExceeded || isGpsDisabled) && !currentAction.complete
                ? styles.primaryButtonDisabled
                : null,
            ]}
            disabled={(isActionBusy || isHosExceeded || isGpsDisabled) && !currentAction.complete}
            onPress={handlePrimaryAction}
          >
            <Text style={styles.primaryButtonText}>
              {isActionBusy ? 'Processing...' : currentAction.label}
            </Text>
          </TouchableOpacity>
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
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
  },
  banner: {
    alignItems: 'center',
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  warningBanner: {
    backgroundColor: '#F59E0B',
  },
  cancelBanner: {
    backgroundColor: '#DC2626',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  warningBannerText: {
    color: '#111827',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  sosButton: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  tripHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tripIdRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  tripId: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  stateBadge: {
    alignItems: 'center',
    borderRadius: 999,
    minHeight: 30,
    minWidth: 114,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  stateBadgePrimary: {
    backgroundColor: '#2563EB',
  },
  stateBadgeSuccess: {
    backgroundColor: '#16A34A',
  },
  stateBadgeDanger: {
    backgroundColor: '#DC2626',
  },
  stateBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  routeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  routeTextGroup: {
    marginLeft: 8,
  },
  routeLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  routeValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  earningsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  hosHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  hosValue: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 4,
  },
  hosNote: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  hosWarning: {
    color: '#F59E0B',
  },
  hosCritical: {
    color: '#DC2626',
  },
  expenseRow: {
    alignItems: 'center',
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  expenseLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  expenseLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  expenseValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  expenseTotalRow: {
    borderBottomWidth: 0,
    marginTop: 6,
  },
  expenseTotalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  expenseTotalValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resultCard: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  resultText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: '#374151',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ActiveTripScreen;
