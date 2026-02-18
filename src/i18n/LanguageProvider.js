import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, textAliases, translations } from './translations';

const APP_LANGUAGE_KEY = 'appLanguage';
const SETTINGS_KEY = 'driverSettings';

const LanguageContext = createContext(null);

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function getByPath(object, path) {
  if (!object || !path) {
    return undefined;
  }
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), object);
}

function interpolate(template, params) {
  if (typeof template !== 'string' || !params || typeof params !== 'object') {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return `{${key}}`;
  });
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

function resolveTranslation(code, key, params) {
  const normalized = normalizeLanguageCode(code);
  const locale = translations[normalized] || translations.en;
  const base = translations.en;
  const value = getByPath(locale, key);
  const fallback = getByPath(base, key);
  const selected = value === undefined ? fallback : value;
  if (typeof selected !== 'string') {
    return key;
  }
  return interpolate(selected, params);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrapLanguage() {
      try {
        const rows = await AsyncStorage.multiGet([APP_LANGUAGE_KEY, SETTINGS_KEY]);
        const data = Object.fromEntries(rows);
        const settings = parseJSON(data[SETTINGS_KEY], {});

        const resolved = normalizeLanguageCode(
          data[APP_LANGUAGE_KEY] || settings.languageCode || settings.language,
        );

        if (!mounted) {
          return;
        }
        setLanguageState(resolved);
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    }

    bootstrapLanguage();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async nextLanguage => {
    const code = normalizeLanguageCode(nextLanguage);
    setLanguageState(code);

    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = parseJSON(raw, {}) || {};
      const languageMeta =
        SUPPORTED_LANGUAGES.find(item => item.code === code) || SUPPORTED_LANGUAGES[0];
      const nextSettings = {
        darkMode:
          typeof settings.darkMode === 'boolean'
            ? settings.darkMode
            : true,
        notificationsEnabled:
          typeof settings.notificationsEnabled === 'boolean'
            ? settings.notificationsEnabled
            : true,
        language: languageMeta.nativeLabel,
        languageCode: code,
      };

      await AsyncStorage.multiSet([
        [APP_LANGUAGE_KEY, code],
        [SETTINGS_KEY, JSON.stringify(nextSettings)],
      ]);
    } catch (_error) {
      // Keep UI responsive even if persistence fails.
    }
  }, []);

  const t = useCallback(
    (key, params) => resolveTranslation(language, key, params),
    [language],
  );

  const tx = useCallback(
    (value, params) => {
      if (typeof value !== 'string') {
        return value;
      }

      const aliasKey = textAliases[value];
      if (aliasKey) {
        return t(aliasKey, params);
      }

      if (value.includes('.')) {
        const candidate = resolveTranslation(language, value, params);
        return candidate === value ? value : candidate;
      }

      return interpolate(value, params);
    },
    [language, t],
  );

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(item => item.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      currentLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isLoaded,
      setLanguage,
      t,
      tx,
    }),
    [currentLanguage, isLoaded, language, setLanguage, t, tx],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
