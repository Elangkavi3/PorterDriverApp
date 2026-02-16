import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const DOCUMENTS_KEY = 'driverDocuments';

const COLORS = {
  background: '#111827',
  card: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  primary: '#2563EB',
  danger: '#DC2626',
  border: '#374151',
};

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function parseDate(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parts = value.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function resolveStatus(expiryDate) {
  const parsed = parseDate(expiryDate);
  if (!parsed) {
    return 'EXPIRED';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'EXPIRED';
  }

  if (diffDays <= 30) {
    return 'EXPIRING';
  }

  return 'VALID';
}

function DocumentUploadScreen({ navigation, route }) {
  const currentDocumentName = route?.params?.documentName || 'Driving License';
  const [expiryDate, setExpiryDate] = useState(route?.params?.expiryDate || '');
  const [hasImage, setHasImage] = useState(false);

  const previewStatus = useMemo(() => {
    if (!expiryDate) {
      return null;
    }
    return resolveStatus(expiryDate);
  }, [expiryDate]);

  const onSubmit = async () => {
    const parsedDate = parseDate(expiryDate);
    if (!parsedDate) {
      Alert.alert('Invalid Date', 'Please enter expiry date in YYYY-MM-DD format.');
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(DOCUMENTS_KEY);
      const storedDocuments = parseJSON(raw, []);
      const documents = Array.isArray(storedDocuments) ? [...storedDocuments] : [];

      const status = resolveStatus(expiryDate);
      const payload = {
        name: currentDocumentName,
        expiryDate,
        status,
        hasImage,
        updatedAt: new Date().toISOString(),
      };

      const index = documents.findIndex((item) => item?.name === currentDocumentName);

      if (index >= 0) {
        documents[index] = payload;
      } else {
        documents.push(payload);
      }

      await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));

      Alert.alert('Success', 'Document updated successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Unable to save document details.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Document Upload</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Document Name</Text>
            <TextInput
              value={currentDocumentName}
              editable={false}
              style={[styles.input, styles.readOnlyInput]}
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>Upload Image</Text>
            <TouchableOpacity
              style={styles.uploadPlaceholder}
              activeOpacity={0.85}
              onPress={() => setHasImage(true)}
            >
              <Text style={styles.uploadText}>
                {hasImage ? 'Image selected (placeholder)' : 'Tap to upload document image'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              style={styles.input}
              keyboardType="numeric"
              placeholder="2026-12-31"
              placeholderTextColor={COLORS.textSecondary}
            />

            {previewStatus === 'EXPIRED' ? (
              <View style={styles.expiredNotice}>
                <Text style={styles.expiredNoticeText}>This document is already expired.</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.submitButton} onPress={onSubmit} activeOpacity={0.85}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
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
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    padding: 20,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#111827',
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  readOnlyInput: {
    color: COLORS.textSecondary,
  },
  uploadPlaceholder: {
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4B5563',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  uploadText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  expiredNotice: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    backgroundColor: '#3A1212',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  expiredNoticeText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    minHeight: 56,
    borderRadius: 16,
    marginTop: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DocumentUploadScreen;
