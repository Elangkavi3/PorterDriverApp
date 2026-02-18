import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const DOCUMENTS_KEY = 'driverDocuments';

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function getDefaultExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function DocumentUploadScreen({ navigation, route }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t, tx } = useLanguage();
  const documentName = route?.params?.documentName || 'Driving License';
  const documentKey = route?.params?.documentKey || normalizeKey(documentName);
  const routeExpiryDate = route?.params?.expiryDate || '';

  const [selectedSource, setSelectedSource] = useState('');
  const [selectedAt, setSelectedAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const previewReady = Boolean(selectedSource);
  const onSelectSource = useCallback(source => {
    setSelectedSource(source);
    setSelectedAt(new Date().toISOString());
  }, []);

  const onConfirmUpload = useCallback(async () => {
    if (!previewReady || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const raw = await AsyncStorage.getItem(DOCUMENTS_KEY);
      const parsed = parseJSON(raw, []);
      const documents = Array.isArray(parsed) ? [...parsed] : [];

      const index = documents.findIndex(item => {
        const key = normalizeKey(item?.key || item?.name);
        return key === documentKey;
      });

      const existing = index >= 0 ? documents[index] : null;
      const payload = {
        ...(existing || {}),
        key: documentKey,
        name: documentName,
        expiryDate: existing?.expiryDate || routeExpiryDate || getDefaultExpiryDate(),
        uploaded: true,
        hasImage: true,
        fileSource: selectedSource,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        documents[index] = payload;
      } else {
        documents.push(payload);
      }

      await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));

      Alert.alert(
        t('documents.uploadConfirmedTitle'),
        t('documents.uploadConfirmedMessage', { name: tx(documentName) }),
        [
          { text: t('common.done'), onPress: () => navigation.goBack() },
        ],
      );
    } catch (_error) {
      Alert.alert(t('documents.uploadFailedTitle'), t('documents.uploadFailedMessage'));
    } finally {
      setIsSaving(false);
    }
  }, [
    documentKey,
    documentName,
    isSaving,
    navigation,
    previewReady,
    routeExpiryDate,
    selectedSource,
    t,
    tx,
  ]);

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader
        title={t('documents.uploadTitle', { name: tx(documentName) })}
        subtitle={t('documents.uploadSubtitle')}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}
      >
        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('documents.selectMethod')}
          </Text>

          <AppButton
            title={t('documents.scanCamera')}
            onPress={() => onSelectSource(t('documents.scanCamera'))}
            style={{ marginTop: spacing[2] }}
          />
          <AppButton
            title={t('documents.uploadDevice')}
            variant="secondary"
            onPress={() => onSelectSource(t('documents.uploadDevice'))}
            style={{ marginTop: spacing[1] }}
          />
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('documents.preview')}</Text>
          {previewReady ? (
            <View style={{ marginTop: spacing[1] }}>
              <Text style={[typography.label, { color: colors.textPrimary }]}>
                {tx(documentName)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                {t('documents.source')}: {selectedSource}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {t('documents.selected')}:{' '}
                {selectedAt ? new Date(selectedAt).toLocaleString() : t('documents.now')}
              </Text>
              <Text style={[typography.caption, { color: colors.success, marginTop: spacing[1] }]}>
                {t('documents.previewReady')}
              </Text>
            </View>
          ) : (
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
              {t('documents.choosePrompt')}
            </Text>
          )}
        </AppCard>

        <AppButton
          title={isSaving ? t('documents.uploading') : t('documents.confirmUpload')}
          onPress={onConfirmUpload}
          disabled={!previewReady || isSaving}
        />
      </ScrollView>
    </AppScreen>
  );
}

export default DocumentUploadScreen;
