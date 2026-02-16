import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const SETTINGS_KEY = 'driverSettings';

const COLORS = {
  background: '#111827',
  card: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  primary: '#2563EB',
  border: '#374151',
};

const DEFAULT_SETTINGS = {
  darkMode: true,
  notificationsEnabled: true,
  language: 'English',
};

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const persistSettings = useCallback(async (next) => {
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

  const toggleDarkMode = useCallback(async (value) => {
    const next = { ...settings, darkMode: value };
    await persistSettings(next);
  }, [persistSettings, settings]);

  const toggleNotifications = useCallback(async (value) => {
    const next = { ...settings, notificationsEnabled: value };
    await persistSettings(next);
  }, [persistSettings, settings]);

  const updateLanguage = useCallback(async (language) => {
    const next = { ...settings, language };
    await persistSettings(next);
  }, [persistSettings, settings]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionLabel}>Dark Mode</Text>
              <Text style={styles.optionHint}>Default enabled for low-light driving operations</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#4B5563', true: '#1D4ED8' }}
              thumbColor={settings.darkMode ? '#FFFFFF' : '#D1D5DB'}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionLabel}>Notifications</Text>
              <Text style={styles.optionHint}>Trip and compliance alerts</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#4B5563', true: '#1D4ED8' }}
              thumbColor={settings.notificationsEnabled ? '#FFFFFF' : '#D1D5DB'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Language</Text>

          <View style={styles.languageRow}>
            {['English', 'Hindi', 'Kannada'].map((language) => {
              const selected = settings.language === language;
              return (
                <TouchableOpacity
                  key={language}
                  style={[styles.languageChip, selected && styles.languageChipSelected]}
                  onPress={() => updateLanguage(language)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.languageText, selected && styles.languageTextSelected]}>{language}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() => Alert.alert('Data & Privacy', 'Data & Privacy screen coming soon.')}
          activeOpacity={0.85}
        >
          <View style={styles.placeholderRow}>
            <Text style={styles.optionLabel}>Data & Privacy</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <Text style={styles.optionHint}>Control data retention and privacy settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    padding: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    gap: 16,
  },
  optionLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  optionHint: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 260,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginVertical: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  languageRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  languageChip: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#111827',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  languageChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#1D4ED8',
  },
  languageText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  languageTextSelected: {
    color: COLORS.textPrimary,
  },
  placeholderRow: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: 20,
    fontWeight: '700',
  },
});

export default SettingsScreen;
