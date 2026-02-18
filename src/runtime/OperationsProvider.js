import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { enqueuePendingAction, flushPendingActions, getPendingActions } from '../services/pendingActionQueue';
import { handleFleetNotification } from '../services/notificationService';

const OperationsContext = createContext(null);

const STORAGE_KEYS = {
  driverAccessState: 'driverAccessState',
  driverRole: 'driverRole',
};

export function OperationsProvider({ children }) {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [accessRevoked, setAccessRevoked] = useState(false);
  const [requiresRoleRefresh, setRequiresRoleRefresh] = useState(false);

  const refreshQueue = useCallback(async () => {
    const queue = await getPendingActions();
    setPendingActions(queue);
    return queue;
  }, []);

  const syncQueue = useCallback(async () => {
    setIsSyncingQueue(true);
    try {
      await flushPendingActions();
      await refreshQueue();
    } finally {
      setIsSyncingQueue(false);
    }
  }, [refreshQueue]);

  useEffect(() => {
    refreshQueue().catch(() => {});

    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);

      if (!offline) {
        syncQueue().catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshQueue, syncQueue]);

  const queueOperationalAction = useCallback(
    async (type, payload) => {
      const action = await enqueuePendingAction({ type, payload });
      await refreshQueue();
      return action;
    },
    [refreshQueue],
  );

  const markAccessRevoked = useCallback(async () => {
    setAccessRevoked(true);
    await AsyncStorage.clear();
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.driverAccessState, 'REVOKED'],
      [STORAGE_KEYS.driverRole, 'DRIVER'],
    ]);
  }, []);

  const handleUnauthorized = useCallback(async () => {
    await markAccessRevoked();
  }, [markAccessRevoked]);

  const handleRoleChanged = useCallback(async role => {
    await AsyncStorage.setItem(STORAGE_KEYS.driverRole, String(role || 'UNKNOWN'));
    setRequiresRoleRefresh(true);
  }, []);

  const acknowledgeRoleRefresh = useCallback(() => {
    setRequiresRoleRefresh(false);
  }, []);

  const handleNotification = useCallback(async notification => {
    return handleFleetNotification(notification);
  }, []);

  const pendingSyncCount = pendingActions.length;

  const value = useMemo(
    () => ({
      isOffline,
      pendingActions,
      pendingSyncCount,
      isSyncingQueue,
      queueOperationalAction,
      syncQueue,
      accessRevoked,
      handleUnauthorized,
      markAccessRevoked,
      requiresRoleRefresh,
      handleRoleChanged,
      acknowledgeRoleRefresh,
      handleNotification,
    }),
    [
      accessRevoked,
      acknowledgeRoleRefresh,
      handleNotification,
      handleRoleChanged,
      handleUnauthorized,
      isOffline,
      isSyncingQueue,
      markAccessRevoked,
      pendingActions,
      pendingSyncCount,
      queueOperationalAction,
      requiresRoleRefresh,
      syncQueue,
    ],
  );

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within OperationsProvider');
  }
  return context;
}
