import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appThemes } from './theme';
import { radius, spacing, typography } from './tokens';

const SETTINGS_KEY = 'driverSettings';
const ThemeContext = createContext(null);

function parseSettings(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const parsed = parseSettings(raw);
        if (!mounted) {
          return;
        }

        if (parsed && typeof parsed.darkMode === 'boolean') {
          setMode(parsed.darkMode ? 'dark' : 'light');
        }
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const setDarkMode = useCallback(async enabled => {
    setMode(enabled ? 'dark' : 'light');

    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const parsed = parseSettings(raw) || {};
      const next = {
        darkMode: enabled,
        notificationsEnabled:
          typeof parsed.notificationsEnabled === 'boolean'
            ? parsed.notificationsEnabled
            : true,
        language: parsed.language || 'English',
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (_error) {
      // No-op: keep UI state responsive even if local persistence fails.
    }
  }, []);

  const value = useMemo(() => {
    const baseTheme = mode === 'light' ? appThemes.light : appThemes.dark;
    return {
      ...baseTheme,
      mode,
      isLoaded,
      spacing,
      radius,
      typography,
      setDarkMode,
      toggleMode: () => setDarkMode(mode !== 'dark'),
    };
  }, [isLoaded, mode, setDarkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}
