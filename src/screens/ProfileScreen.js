import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  formatDocumentDate,
  summarizeRequiredDocuments,
} from '../services/documentVerification';
import {
  getVehicleStatusLabel,
  getVehicleStatusTone,
  normalizeVehicleStatus,
} from '../services/vehicleStatus';
import {
  buildRoutePreferencesSummary,
  getDefaultRoutePreferences,
  getRoutePreferencesStorageKey,
  normalizeRoutePreferences,
} from '../services/routePreferences';

const STORAGE_KEYS = {
  profile: 'driverProfile',
  documents: 'driverDocuments',
  settings: 'driverSettings',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
  routePreferences: getRoutePreferencesStorageKey(),
};

const MOCK_PROFILE = {
  id: 'PD-10482',
  name: 'Ravi Kumar',
  phone: '9876543210',
  vehicleType: '16ft Truck',
  ownerName: 'Porter Logistics',
  bankName: 'HDFC Bank',
  accountMasked: 'XXXXXX6721',
  ifsc: 'HDFC0000217',
};

const DEFAULT_SETTINGS = {
  darkMode: true,
  notificationsEnabled: true,
  language: 'English',
};
const DISPLAY_APP_VERSION = '1.0.0';

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function ProfileScreen({ navigation }) {
  const { colors, spacing, typography, mode, setDarkMode } = useAppTheme();
  const { t, tx, language, currentLanguage, supportedLanguages, setLanguage } = useLanguage();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [documentSummary, setDocumentSummary] = useState(() =>
    summarizeRequiredDocuments([]),
  );
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [vehicleStatus, setVehicleStatus] = useState('INSPECTION_PENDING');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [routePreferences, setRoutePreferences] = useState(getDefaultRoutePreferences());

  const hydrateProfileData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.multiGet([
        STORAGE_KEYS.profile,
        STORAGE_KEYS.documents,
        STORAGE_KEYS.settings,
        STORAGE_KEYS.vehicleSafetyStatus,
        STORAGE_KEYS.routePreferences,
      ]);

      const dataMap = Object.fromEntries(stored);
      let profileData = parseJSON(dataMap[STORAGE_KEYS.profile], null);
      let documentsData = parseJSON(dataMap[STORAGE_KEYS.documents], []);
      let settingsData = parseJSON(dataMap[STORAGE_KEYS.settings], null);
      const updates = [];

      if (!profileData) {
        profileData = MOCK_PROFILE;
        updates.push([STORAGE_KEYS.profile, JSON.stringify(profileData)]);
      }

      if (!Array.isArray(documentsData)) {
        documentsData = [];
        updates.push([STORAGE_KEYS.documents, JSON.stringify([])]);
      }

      if (!settingsData) {
        settingsData = DEFAULT_SETTINGS;
        updates.push([STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS)]);
      }

      if (updates.length > 0) {
        await AsyncStorage.multiSet(updates);
      }

      setProfile(profileData);
      setDocumentSummary(summarizeRequiredDocuments(documentsData));
      setSettings({
        darkMode: typeof settingsData.darkMode === 'boolean' ? settingsData.darkMode : true,
        notificationsEnabled:
          typeof settingsData.notificationsEnabled === 'boolean'
            ? settingsData.notificationsEnabled
            : true,
        language: settingsData.language || 'English',
      });
      setVehicleStatus(normalizeVehicleStatus(dataMap[STORAGE_KEYS.vehicleSafetyStatus]));
      const normalizedRoutePreferences = normalizeRoutePreferences(
        parseJSON(dataMap[STORAGE_KEYS.routePreferences], null),
      );
      setRoutePreferences(normalizedRoutePreferences);
    } catch (_error) {
      Alert.alert(t('alerts.tripBlocked'), t('profile.loadError'));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      hydrateProfileData();
    }, [hydrateProfileData]),
  );

  const initials = useMemo(() => {
    const names = profile?.name?.split(' ') || [];
    return names
      .slice(0, 2)
      .map(part => part?.[0] || '')
      .join('')
      .toUpperCase();
  }, [profile?.name]);

  const documentsForDisplay = useMemo(() => {
    if (profile?.vehicleRcApplicable === false) {
      return documentSummary.documents.filter(item => item.key !== 'vehicle_rc');
    }
    return documentSummary.documents;
  }, [documentSummary.documents, profile?.vehicleRcApplicable]);
  const routePreferenceSummary = useMemo(
    () => buildRoutePreferencesSummary(routePreferences, t),
    [routePreferences, t],
  );

  const updateSettings = useCallback(async next => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
  }, []);

  const onToggleTheme = useCallback(
    async value => {
      await setDarkMode(value);
      await updateSettings({ ...settings, darkMode: value });
    },
    [setDarkMode, settings, updateSettings],
  );

  const openDocumentUpload = useCallback(
    document => {
      navigation.navigate('DocumentUploadScreen', {
        documentName: tx(document.name),
        documentKey: document.key,
        expiryDate: document.expiryDate,
      });
    },
    [navigation, tx],
  );

  const onConfirmLogout = useCallback(async () => {
    try {
      await AsyncStorage.clear();

      const tabNavigator = navigation.getParent();
      const rootNavigator = tabNavigator?.getParent();

      if (rootNavigator) {
        rootNavigator.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        });
      } else {
        navigation.navigate('AuthStack');
      }
    } catch (_error) {
      Alert.alert(t('alerts.tripBlocked'), t('profile.logoutError'));
    }
  }, [navigation, t]);

  const onSelectLanguage = useCallback(
    async code => {
      await setLanguage(code);
      setShowLanguageModal(false);
    },
    [setLanguage],
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}
      >
        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('brand.appName')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('brand.versionLabel', { version: DISPLAY_APP_VERSION })}
          </Text>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                minHeight: 56,
                minWidth: 56,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[typography.h2, { color: colors.textPrimary }]}>
                {initials || 'DR'}
              </Text>
            </View>
            <AppBadge label="ACTIVE" />
          </View>
          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing[1] }]}>
            {profile.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('profile.driverId')}: {profile.id}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('profile.owner')}: {profile.ownerName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('profile.vehicle')}: {profile.vehicleType}
          </Text>
          <View style={{ marginTop: spacing[1] }}>
            <AppBadge
              label={getVehicleStatusLabel(vehicleStatus)}
              tone={getVehicleStatusTone(vehicleStatus)}
            />
          </View>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('profile.documentVerification')}
          </Text>
          <Text
            style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}
          >
            {t('profile.documentStatus')}
          </Text>

          {documentsForDisplay.map((doc, index) => (
            <TouchableOpacity
              key={doc.key}
              activeOpacity={0.88}
              onPress={() => openDocumentUpload(doc)}
              style={{
                marginTop: spacing[1],
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
                paddingTop: index === 0 ? 0 : spacing[1],
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  {tx(doc.name)}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('profile.expiry')}: {formatDocumentDate(doc.expiryDate)}
                </Text>
              </View>
              <AppBadge label={doc.badgeLabel} tone={doc.badgeTone} />
            </TouchableOpacity>
          ))}
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('RoutePreferencesScreen')}
            style={{ minHeight: 48, justifyContent: 'center' }}
          >
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              {t('routePreferences.summaryTitle')}
            </Text>
            <Text
              style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}
            >
              {t('routePreferences.summaryRegions', { regions: routePreferenceSummary.regions })}
            </Text>
            <Text
              style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}
            >
              {t('routePreferences.summaryRouteType', {
                routeType: routePreferenceSummary.routeType,
              })}
            </Text>
          </TouchableOpacity>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('profile.preferences')}</Text>
          <View
            style={{
              marginTop: spacing[1],
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: 48,
            }}
          >
            <Text style={[typography.label, { color: colors.textSecondary }]}>{t('profile.darkMode')}</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={onToggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textOnColor}
            />
          </View>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('profile.language')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('language.currentLanguage')}: {currentLanguage.nativeLabel}
          </Text>
          <AppButton
            title={t('language.changeLanguage')}
            variant="secondary"
            onPress={() => setShowLanguageModal(true)}
            style={{ marginTop: spacing[1] }}
          />
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('profile.bankDetails')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.bank')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{profile.bankName}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.account')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>
            {profile.accountMasked}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.ifsc')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{profile.ifsc}</Text>
        </AppCard>

        <TouchableOpacity
          onPress={onConfirmLogout}
          activeOpacity={0.9}
          style={{
            minHeight: 48,
            borderRadius: 16,
            backgroundColor: colors.critical,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing[1],
          }}
        >
          <Text style={[typography.label, { color: colors.textOnColor }]}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent
        visible={showLanguageModal}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            paddingHorizontal: spacing[2],
          }}
        >
          <AppCard>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              {t('language.chooseModalTitle')}
            </Text>
            <View style={{ marginTop: spacing[1], gap: spacing[1] }}>
              {supportedLanguages.map(item => {
                const selected = item.code === language;
                return (
                  <TouchableOpacity
                    key={item.code}
                    activeOpacity={0.9}
                    onPress={() => onSelectLanguage(item.code)}
                    style={{
                      minHeight: 48,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                      justifyContent: 'center',
                      paddingHorizontal: spacing[2],
                    }}
                  >
                    <Text style={[typography.label, { color: colors.textOnColor }]}>
                      {item.nativeLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <AppButton
              title={t('common.cancel')}
              variant="secondary"
              onPress={() => setShowLanguageModal(false)}
              style={{ marginTop: spacing[2] }}
            />
          </AppCard>
        </View>
      </Modal>
    </AppScreen>
  );
}

export default ProfileScreen;
