import AsyncStorage from '@react-native-async-storage/async-storage';

export const PENDING_ACTION_QUEUE_KEY = 'pendingActionQueue';

const STORAGE_KEYS = {
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  jobsList: 'jobsList',
  pendingPodUploads: 'pendingPodUploads',
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

function getTripStatusFromState(nextState) {
  const state = String(nextState || '').toUpperCase();
  if (state === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (state === 'CANCELLED') {
    return 'CANCELLED';
  }
  return 'ACTIVE';
}

async function loadQueue() {
  const raw = await AsyncStorage.getItem(PENDING_ACTION_QUEUE_KEY);
  const list = parseJson(raw, []);
  return Array.isArray(list) ? list : [];
}

async function saveQueue(queue) {
  await AsyncStorage.setItem(PENDING_ACTION_QUEUE_KEY, JSON.stringify(queue));
}

export async function getPendingActions() {
  return loadQueue();
}

export async function enqueuePendingAction(action) {
  const queue = await loadQueue();
  const payload = {
    id: action?.id || `ACT-${Date.now()}`,
    type: String(action?.type || 'UNKNOWN'),
    payload: action?.payload || {},
    status: 'PENDING_SYNC',
    createdAt: action?.createdAt || new Date().toISOString(),
  };

  const nextQueue = [payload, ...queue];
  await saveQueue(nextQueue);
  return payload;
}

async function applyQueuedAction(action) {
  if (!action || typeof action !== 'object') {
    return true;
  }

  const type = String(action.type || '').toUpperCase();
  const payload = action.payload || {};

  if (type === 'TRIP_STATE_TRANSITION' || type === 'OTP_VERIFICATION') {
    const rows = await AsyncStorage.multiGet([
      STORAGE_KEYS.activeTrip,
      STORAGE_KEYS.tripState,
      STORAGE_KEYS.jobsList,
    ]);
    const data = Object.fromEntries(rows);
    const activeTrip = parseJson(data[STORAGE_KEYS.activeTrip], null);

    if (!activeTrip || String(activeTrip.id) !== String(payload.tripId || activeTrip.id)) {
      return true;
    }

    const nextState = String(payload.nextState || data[STORAGE_KEYS.tripState] || 'ASSIGNED');
    const nextTrip = {
      ...activeTrip,
      status: getTripStatusFromState(nextState),
    };

    const updates = [
      [STORAGE_KEYS.tripState, nextState],
      [STORAGE_KEYS.activeTrip, JSON.stringify(nextTrip)],
    ];

    const jobs = parseJson(data[STORAGE_KEYS.jobsList], []);
    if (Array.isArray(jobs)) {
      const nextJobs = jobs.map(job =>
        job?.id === nextTrip.id
          ? { ...job, status: nextTrip.status }
          : job,
      );
      updates.push([STORAGE_KEYS.jobsList, JSON.stringify(nextJobs)]);
    }

    await AsyncStorage.multiSet(updates);
    return true;
  }

  if (type === 'POD_UPLOAD') {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.pendingPodUploads);
    const list = parseJson(raw, []);
    const nextList = Array.isArray(list) ? [payload, ...list] : [payload];
    await AsyncStorage.setItem(STORAGE_KEYS.pendingPodUploads, JSON.stringify(nextList));
    return true;
  }

  return true;
}

export async function flushPendingActions() {
  const queue = await loadQueue();
  if (queue.length === 0) {
    return [];
  }

  const remaining = [];

  for (const item of queue) {
    try {
      const applied = await applyQueuedAction(item);
      if (!applied) {
        remaining.push(item);
      }
    } catch (_error) {
      remaining.push(item);
    }
  }

  await saveQueue(remaining);
  return remaining;
}
