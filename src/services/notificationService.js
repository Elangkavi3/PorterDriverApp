import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const STORAGE_KEYS = {
  jobsList: 'jobsList',
  documentExpiryAlert: 'documentExpiryAlert',
  complianceWarning: 'complianceWarning',
};
const APP_LANGUAGE_KEY = 'appLanguage';

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

function normalizeLanguageCode(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'ta' || raw === 'tamil' || raw === 'தமிழ்') {
    return 'ta';
  }
  if (raw === 'hi' || raw === 'hindi' || raw === 'हिन्दी') {
    return 'hi';
  }
  return 'en';
}

function getByPath(object, path) {
  if (!object || !path) {
    return undefined;
  }

  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), object);
}

function resolveLabel(languageCode, key, fallback) {
  const locale = translations[languageCode] || translations.en;
  return getByPath(locale, key) || getByPath(translations.en, key) || fallback;
}

export async function handleFleetNotification(notification) {
  const type = String(notification?.type || '').toUpperCase();
  const payload = notification?.payload || {};
  const languageCode = normalizeLanguageCode(await AsyncStorage.getItem(APP_LANGUAGE_KEY));
  const appName = resolveLabel(languageCode, 'brand.appName', 'Nalvel Driver');

  if (type === 'NEW_TRIP_ASSIGNED') {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.jobsList);
    const jobs = parseJson(raw, []);
    const list = Array.isArray(jobs) ? jobs : [];

    const trip = {
      id: String(payload.id || `PD-${Date.now()}`),
      pickup: String(payload.pickup || 'Pickup'),
      drop: String(payload.drop || 'Drop'),
      status: 'ASSIGNED',
      date: String(payload.date || new Date().toISOString().slice(0, 10)),
      earnings: typeof payload.earnings === 'number' ? payload.earnings : 0,
      distance: String(payload.distance || '0 km'),
      eta: String(payload.eta || '0h 00m'),
      paymentStatus: 'UNPAID',
    };

    const nextJobs = [trip, ...list.filter(job => job?.id !== trip.id)];
    await AsyncStorage.setItem(STORAGE_KEYS.jobsList, JSON.stringify(nextJobs));
    return {
      target: { tab: 'Home' },
      notification: {
        title: appName,
        subtitle: String(
          payload.subtitle || resolveLabel(languageCode, 'notifications.newTripAssigned', 'New Trip Assigned'),
        ),
      },
    };
  }

  if (type === 'DOCUMENT_EXPIRING') {
    await AsyncStorage.setItem(
      STORAGE_KEYS.documentExpiryAlert,
      JSON.stringify({
        level: 'WARNING',
        message: String(
          payload.message
            || resolveLabel(languageCode, 'notifications.documentExpiring', 'Document expiry approaching'),
        ),
        at: new Date().toISOString(),
      }),
    );
    return {
      target: { tab: 'Home' },
      notification: {
        title: appName,
        subtitle: String(
          payload.subtitle || resolveLabel(languageCode, 'notifications.documentExpiring', 'Document Expiring'),
        ),
      },
    };
  }

  if (type === 'PAYMENT_MARKED') {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.jobsList);
    const jobs = parseJson(raw, []);

    if (Array.isArray(jobs)) {
      const nextJobs = jobs.map(job =>
        job?.id === payload.tripId
          ? { ...job, status: 'COMPLETED', paymentStatus: 'PAID' }
          : job,
      );
      await AsyncStorage.setItem(STORAGE_KEYS.jobsList, JSON.stringify(nextJobs));
    }

    return {
      target: { tab: 'Jobs', filter: 'PAID' },
      notification: {
        title: appName,
        subtitle: String(
          payload.subtitle || resolveLabel(languageCode, 'notifications.paymentMarked', 'Payment Marked'),
        ),
      },
    };
  }

  if (type === 'COMPLIANCE_WARNING') {
    await AsyncStorage.setItem(
      STORAGE_KEYS.complianceWarning,
      JSON.stringify({
        level: 'WARNING',
        message: String(
          payload.message
            || resolveLabel(languageCode, 'notifications.complianceWarning', 'Compliance action required'),
        ),
        at: new Date().toISOString(),
      }),
    );
    return {
      target: { tab: 'Home' },
      notification: {
        title: appName,
        subtitle: String(
          payload.subtitle || resolveLabel(languageCode, 'notifications.complianceWarning', 'Compliance Warning'),
        ),
      },
    };
  }

  return {
    target: null,
    notification: {
      title: appName,
      subtitle: String(payload.subtitle || ''),
    },
  };
}
