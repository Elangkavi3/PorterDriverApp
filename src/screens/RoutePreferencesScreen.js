import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  addPreferredCity,
  buildRoutePreferencesSummary,
  DRIVING_CONDITION_OPTIONS,
  getDefaultRoutePreferences,
  getRoutePreferencesStorageKey,
  normalizeRoutePreferences,
  REGION_OPTIONS,
  removePreferredCity,
  ROUTE_TYPE_OPTIONS,
  toggleDrivingPreference,
  toggleRegionPreference,
} from '../services/routePreferences';
import { useAppTheme } from '../theme/ThemeProvider';

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function RoutePreferencesScreen({ navigation }) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const [preferences, setPreferences] = useState(getDefaultRoutePreferences());
  const [cityDraft, setCityDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    const key = getRoutePreferencesStorageKey();
    const raw = await AsyncStorage.getItem(key);
    setPreferences(normalizeRoutePreferences(parseJSON(raw, null)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreferences().catch(() => {
        setPreferences(getDefaultRoutePreferences());
      });
    }, [loadPreferences]),
  );

  const addCity = useCallback(() => {
    setPreferences(current => ({
      ...current,
      cities: addPreferredCity(current.cities, cityDraft),
    }));
    setCityDraft('');
  }, [cityDraft]);

  const routePreferenceSummary = useMemo(
    () => buildRoutePreferencesSummary(preferences, t),
    [preferences, t],
  );

  const savePreferences = useCallback(async () => {
    setIsSaving(true);
    try {
      const next = normalizeRoutePreferences(preferences);
      await AsyncStorage.setItem(getRoutePreferencesStorageKey(), JSON.stringify(next));

      if (Platform.OS === 'android') {
        ToastAndroid.show(t('routePreferences.updated'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('routePreferences.updated'));
      }

      navigation.goBack();
    } catch (_error) {
      Alert.alert(t('alerts.tripBlocked'), t('profile.loadError'));
    } finally {
      setIsSaving(false);
    }
  }, [navigation, preferences, t]);

  const renderMultiSelectChips = (options, selectedValues, onToggle) => (
    <View style={styles.chipWrap}>
      {options.map(option => {
        const selected = selectedValues.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.88}
            onPress={() => onToggle(option.value)}
            style={[
              styles.chip,
              {
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                marginRight: spacing[1],
                marginBottom: spacing[1],
                paddingHorizontal: spacing[2],
              },
            ]}
          >
            <Text style={[typography.label, { color: selected ? colors.textOnColor : colors.textPrimary }]}>
              {t(option.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSingleSelectChips = (options, selectedValue, onSelect) => (
    <View style={styles.chipWrap}>
      {options.map(option => {
        const selected = option.value === selectedValue;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.88}
            onPress={() => onSelect(option.value)}
            style={[
              styles.chip,
              {
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                marginRight: spacing[1],
                marginBottom: spacing[1],
                paddingHorizontal: spacing[2],
              },
            ]}
          >
            <Text style={[typography.label, { color: selected ? colors.textOnColor : colors.textPrimary }]}>
              {t(option.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('routePreferences.title')} subtitle={t('routePreferences.subtitle')} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('routePreferences.preferredRegions')}
          </Text>
          <View style={{ marginTop: spacing[1] }}>
            {renderMultiSelectChips(REGION_OPTIONS, preferences.regions, value => {
              setPreferences(current => ({
                ...current,
                regions: toggleRegionPreference(current.regions, value),
              }));
            })}
          </View>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('routePreferences.preferredCities')}
          </Text>
          <View
            style={{
              marginTop: spacing[1],
              minHeight: spacing[6],
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing[1],
            }}
          >
            <TextInput
              value={cityDraft}
              onChangeText={setCityDraft}
              placeholder={t('routePreferences.addPreferredCity')}
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addCity}
              style={[styles.cityInput, { color: colors.textPrimary }]}
            />
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={addCity}
              style={{
                minHeight: spacing[6],
                minWidth: 72,
                borderRadius: radius.card,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={[typography.label, { color: colors.textPrimary }]}>
                {t('routePreferences.addCity')}
              </Text>
            </TouchableOpacity>
          </View>

          {preferences.cities.length > 0 ? (
            <View style={[styles.chipWrap, { marginTop: spacing[1] }]}>
              {preferences.cities.map(city => (
                <View
                  key={city}
                  style={[
                    styles.chip,
                    {
                      minHeight: spacing[6],
                      borderRadius: radius.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                      marginRight: spacing[1],
                      marginBottom: spacing[1],
                      paddingHorizontal: spacing[2],
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={[typography.label, { color: colors.textPrimary }]}>{city}</Text>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() =>
                      setPreferences(current => ({
                        ...current,
                        cities: removePreferredCity(current.cities, city),
                      }))
                    }
                    style={{ marginLeft: spacing[1] }}
                  >
                    <Text style={[typography.label, { color: colors.textSecondary }]}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('routePreferences.routeType')}
          </Text>
          <View style={{ marginTop: spacing[1] }}>
            {renderSingleSelectChips(ROUTE_TYPE_OPTIONS, preferences.routeType, value => {
              setPreferences(current => ({ ...current, routeType: value }));
            })}
          </View>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('routePreferences.drivingPreference')}
          </Text>
          <View style={{ marginTop: spacing[1] }}>
            {renderMultiSelectChips(
              DRIVING_CONDITION_OPTIONS,
              preferences.drivingConditions,
              value => {
                setPreferences(current => ({
                  ...current,
                  drivingConditions: toggleDrivingPreference(current.drivingConditions, value),
                }));
              },
            )}
          </View>
        </AppCard>

        <AppCard>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('routePreferences.summaryRegions', { regions: routePreferenceSummary.regions })}
          </Text>
          <Text
            style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}
          >
            {t('routePreferences.summaryRouteType', { routeType: routePreferenceSummary.routeType })}
          </Text>
          <AppButton
            title={t('routePreferences.save')}
            onPress={savePreferences}
            disabled={isSaving}
            style={{ marginTop: spacing[2] }}
          />
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  cityInput: {
    flex: 1,
    paddingHorizontal: 8,
  },
});

export default RoutePreferencesScreen;
