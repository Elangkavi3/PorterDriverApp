import React, { useCallback, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const SETTINGS_KEY = 'driverSettings';

const DEFAULT_SETTINGS = {
  darkMode: true,
  notificationsEnabled: true,
  language: 'English',
};

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function SettingsScreen() {
  const { colors, spacing, typography, mode, setDarkMode } = useAppTheme();
  const { t, language, supportedLanguages, setLanguage } = useLanguage();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const persistSettings = useCallback(async next => {
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const stored = parseJSON(raw, null);

        if (stored) {
          setSettings({
            darkMode:
              typeof stored.darkMode === 'boolean'
                ? stored.darkMode
                : DEFAULT_SETTINGS.darkMode,
            notificationsEnabled:
              typeof stored.notificationsEnabled === 'boolean'
                ? stored.notificationsEnabled
                : DEFAULT_SETTINGS.notificationsEnabled,
            language: stored.language || DEFAULT_SETTINGS.language,
          });
        } else {
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
          setSettings(DEFAULT_SETTINGS);
        }
      }

      loadSettings();
    }, []),
  );

  const toggleDarkMode = useCallback(
    async value => {
      const next = { ...settings, darkMode: value };
      await setDarkMode(value);
      await persistSettings(next);
    },
    [persistSettings, setDarkMode, settings],
  );

  const toggleNotifications = useCallback(
    async value => {
      const next = { ...settings, notificationsEnabled: value };
      await persistSettings(next);
    },
    [persistSettings, settings],
  );

  const updateLanguage = useCallback(
    async languageValue => {
      const next = { ...settings, language: languageValue };
      await persistSettings(next);
    },
    [persistSettings, settings],
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        <AppCard style={{ marginBottom: spacing[1] }}>
          <View style={{ minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{t('profile.darkMode')}</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textOnColor}
            />
          </View>

          <View style={{ minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{t('settings.notifications')}</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textOnColor}
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('profile.language')}</Text>
          <View style={{ marginTop: spacing[1], flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1] }}>
            {supportedLanguages.map(item => {
              const selected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={{
                    minHeight: 48,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                    justifyContent: 'center',
                    paddingHorizontal: spacing[2],
                  }}
                  onPress={async () => {
                    await setLanguage(item.code);
                    await updateLanguage(item.nativeLabel);
                  }}
                >
                  <Text style={[typography.label, { color: colors.textOnColor }]}>{item.nativeLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

export default SettingsScreen;
