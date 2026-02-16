import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const DOCUMENTS_KEY = 'driverDocuments';

const COLORS = {
  background: '#111827',
  card: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  primary: '#2563EB',
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

function formatDate(expiryDate) {
  const date = parseDate(expiryDate);
  if (!date) {
    return 'Not available';
  }

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getStatusColor(status) {
  if (status === 'VALID') {
    return COLORS.success;
  }

  if (status === 'EXPIRING') {
    return COLORS.warning;
  }

  return COLORS.danger;
}

function DocumentsScreen({ navigation }) {
  const [documents, setDocuments] = useState([]);

  useFocusEffect(
    useCallback(() => {
      async function loadDocuments() {
        const raw = await AsyncStorage.getItem(DOCUMENTS_KEY);
        const storedDocuments = parseJSON(raw, []);

        if (Array.isArray(storedDocuments)) {
          const normalized = storedDocuments.map((doc) => ({
            name: doc?.name || 'Document',
            expiryDate: doc?.expiryDate || '',
            status: resolveStatus(doc?.expiryDate),
          }));

          setDocuments(normalized);
        }
      }

      loadDocuments();
    }, []),
  );

  const keyExtractor = useCallback((item) => item.name, []);

  const emptyComponent = useMemo(() => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No documents available.</Text>
      </View>
    );
  }, []);

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.expiryText}>Expiry Date: {formatDate(item.expiryDate)}</Text>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('DocumentUploadScreen', {
              documentName: item.name,
              expiryDate: item.expiryDate,
            })
          }
        >
          <Text style={styles.actionButtonText}>Upload / Update</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Documents</Text>
      </View>

      <FlatList
        data={documents}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    padding: 18,
    gap: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#111827',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expiryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    padding: 20,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default DocumentsScreen;
