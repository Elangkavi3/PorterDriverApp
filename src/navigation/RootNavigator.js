import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import ActiveTripScreen from '../screens/ActiveTripScreen';
import SOSFullScreen from '../screens/SOSFullScreen';
import SplashScreen from '../screens/SplashScreen';
import SessionExpiredScreen from '../screens/SessionExpiredScreen';
import NetworkErrorScreen from '../screens/NetworkErrorScreen';

const RootStack = createNativeStackNavigator();

const STORAGE_KEYS = {
  appLanguage: 'appLanguage',
  driverSettings: 'driverSettings',
  isLoggedIn: 'isLoggedIn',
  authToken: 'authToken',
  authTokenExpiry: 'authTokenExpiry',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
};

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

function getTokenStatus(token, expiryRaw) {
  if (!token || !expiryRaw) {
    return 'missing';
  }

  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry)) {
    return 'expired';
  }

  return Date.now() < expiry ? 'valid' : 'expired';
}

function hasActiveTrip(activeTripRaw, tripStateRaw) {
  const activeTrip = parseJson(activeTripRaw, null);
  if (!activeTrip || typeof activeTrip !== 'object' || !activeTrip.id) {
    return false;
  }

  const parsedTripState = parseJson(tripStateRaw, tripStateRaw);
  const tripState =
    typeof parsedTripState === 'object' && parsedTripState?.status
      ? String(parsedTripState.status).toUpperCase()
      : String(parsedTripState || 'ASSIGNED').toUpperCase();
  return !['COMPLETED', 'CANCELLED', 'IDLE'].includes(tripState);
}

function RootNavigator() {
  const [bootState, setBootState] = useState({
    loading: true,
    hasError: false,
    startupRoute: null,
    authInitialScreen: 'Welcome',
    mainHomeInitialRoute: 'HomeMain',
  });
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function resolveStartupRoute() {
      setBootState(current => ({ ...current, loading: true, hasError: false }));

      try {
        const rows = await AsyncStorage.multiGet([
          STORAGE_KEYS.appLanguage,
          STORAGE_KEYS.driverSettings,
          STORAGE_KEYS.isLoggedIn,
          STORAGE_KEYS.authToken,
          STORAGE_KEYS.authTokenExpiry,
          STORAGE_KEYS.activeTrip,
          STORAGE_KEYS.tripState,
        ]);

        if (!mounted) {
          return;
        }

        const data = Object.fromEntries(rows);

        if (!data[STORAGE_KEYS.appLanguage]) {
          setBootState({
            loading: false,
            hasError: false,
            startupRoute: 'AuthStack',
            authInitialScreen: 'LanguageSelection',
            mainHomeInitialRoute: 'HomeMain',
          });
          return;
        }

        if (!data[STORAGE_KEYS.driverSettings]) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.driverSettings,
            JSON.stringify({ darkMode: true, notificationsEnabled: true, language: 'English' }),
          );
        }

        const tokenStatus = getTokenStatus(
          data[STORAGE_KEYS.authToken],
          data[STORAGE_KEYS.authTokenExpiry],
        );

        if (tokenStatus === 'expired') {
          setBootState({
            loading: false,
            hasError: false,
            startupRoute: 'SessionExpired',
            authInitialScreen: 'Login',
            mainHomeInitialRoute: 'HomeMain',
          });
          return;
        }

        const isLoggedIn =
          data[STORAGE_KEYS.isLoggedIn] === 'true' && tokenStatus === 'valid';

        if (!isLoggedIn) {
          setBootState({
            loading: false,
            hasError: false,
            startupRoute: 'AuthStack',
            authInitialScreen: 'Welcome',
            mainHomeInitialRoute: 'HomeMain',
          });
          return;
        }

        if (hasActiveTrip(data[STORAGE_KEYS.activeTrip], data[STORAGE_KEYS.tripState])) {
          setBootState({
            loading: false,
            hasError: false,
            startupRoute: 'ActiveTripEntry',
            authInitialScreen: 'Welcome',
            mainHomeInitialRoute: 'ActiveTrip',
          });
          return;
        }

        setBootState({
          loading: false,
          hasError: false,
          startupRoute: 'MainTabs',
          authInitialScreen: 'Welcome',
          mainHomeInitialRoute: 'HomeMain',
        });
      } catch (_error) {
        if (mounted) {
          setBootState({
            loading: false,
            hasError: true,
            startupRoute: null,
            authInitialScreen: 'Welcome',
            mainHomeInitialRoute: 'HomeMain',
          });
        }
      }
    }

    resolveStartupRoute();

    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const initialParams = useMemo(
    () => ({ homeInitialRoute: bootState.mainHomeInitialRoute }),
    [bootState.mainHomeInitialRoute],
  );

  if (bootState.loading) {
    return <SplashScreen />;
  }

  if (bootState.hasError) {
    return <NetworkErrorScreen onRetry={() => setRefreshTick(value => value + 1)} />;
  }

  return (
    <RootStack.Navigator initialRouteName={bootState.startupRoute} screenOptions={{ headerShown: false }}>
      <RootStack.Screen
        name="AuthStack"
        component={AuthStack}
        initialParams={{ initialScreen: bootState.authInitialScreen }}
      />
      <RootStack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        initialParams={initialParams}
      />
      <RootStack.Screen name="SessionExpired" component={SessionExpiredScreen} />
      <RootStack.Screen name="ActiveTripEntry" component={ActiveTripScreen} />
      <RootStack.Screen name="SOSFullScreen" component={SOSFullScreen} />
    </RootStack.Navigator>
  );
}

export default RootNavigator;
