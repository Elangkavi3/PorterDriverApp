import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE_KEYS = {
  profile: 'driverProfile',
  documents: 'driverDocuments',
  walletBalance: 'walletBalance',
  isLoggedIn: 'isLoggedIn',
};

const COLORS = {
  background: '#111827',
  card: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  border: '#374151',
};

const MOCK_PROFILE = {
  id: 'PD-10482',
  name: 'Ravi Kumar',
  phone: '9876543210',
  rating: 4.8,
  completedTrips: 124,
  onTimePercentage: 96,
  vehicleType: '16ft Truck',
  ownerName: 'Porter Logistics',
};

const DEFAULT_DOCUMENTS = [
  { name: 'Driving License', expiryDate: '2027-01-31' },
  { name: 'Fitness Certificate', expiryDate: '2026-03-05' },
  { name: 'Insurance', expiryDate: '2026-01-05' },
  { name: 'RC', expiryDate: '2027-06-30' },
  { name: 'PUC', expiryDate: '2026-08-30' },
];

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

function resolveDocumentStatus(expiryDate) {
  const date = parseDate(expiryDate);
  if (!date) {
    return 'EXPIRED';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'EXPIRED';
  }

  if (diffDays <= 30) {
    return 'EXPIRING';
  }

  return 'VALID';
}

function normalizeDocuments(documents) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return DEFAULT_DOCUMENTS.map((doc) => ({
      ...doc,
      status: resolveDocumentStatus(doc.expiryDate),
    }));
  }

  return documents.map((doc) => ({
    name: doc?.name || 'Document',
    expiryDate: doc?.expiryDate || '',
    status: resolveDocumentStatus(doc?.expiryDate),
  }));
}

function getStatusColors(status) {
  if (status === 'VALID') {
    return { borderColor: COLORS.success, textColor: COLORS.success };
  }

  if (status === 'EXPIRING') {
    return { borderColor: COLORS.warning, textColor: COLORS.warning };
  }

  return { borderColor: COLORS.danger, textColor: COLORS.danger };
}

function formatDateLabel(dateString) {
  const date = parseDate(dateString);
  if (!date) {
    return 'Invalid date';
  }

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [documents, setDocuments] = useState([]);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const hydrateProfileData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.multiGet([
        STORAGE_KEYS.profile,
        STORAGE_KEYS.documents,
        STORAGE_KEYS.walletBalance,
        STORAGE_KEYS.isLoggedIn,
      ]);

      const dataMap = Object.fromEntries(stored);
      let profileData = parseJSON(dataMap[STORAGE_KEYS.profile], null);
      let documentsData = parseJSON(dataMap[STORAGE_KEYS.documents], null);
      const updates = [];

      if (!profileData) {
        profileData = MOCK_PROFILE;
        updates.push([STORAGE_KEYS.profile, JSON.stringify(profileData)]);
      }

      documentsData = normalizeDocuments(documentsData);
      updates.push([STORAGE_KEYS.documents, JSON.stringify(documentsData)]);

      if (!dataMap[STORAGE_KEYS.walletBalance]) {
        updates.push([STORAGE_KEYS.walletBalance, '0']);
      }

      if (!dataMap[STORAGE_KEYS.isLoggedIn]) {
        updates.push([STORAGE_KEYS.isLoggedIn, 'true']);
      }

      if (updates.length > 0) {
        await AsyncStorage.multiSet(updates);
      }

      setProfile(profileData);
      setDocuments(documentsData);
    } catch (error) {
      Alert.alert('Error', 'Unable to load profile data.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydrateProfileData();
    }, [hydrateProfileData]),
  );

  const initials = useMemo(() => {
    const names = profile?.name?.split(' ') || [];
    return names
      .slice(0, 2)
      .map((part) => part?.[0] || '')
      .join('')
      .toUpperCase();
  }, [profile?.name]);

  const isLicenseExpired = useMemo(() => {
    return documents.some(
      (doc) => doc.name === 'Driving License' && resolveDocumentStatus(doc.expiryDate) === 'EXPIRED',
    );
  }, [documents]);

  const onConfirmLogout = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      setIsLogoutModalVisible(false);

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
    } catch (error) {
      Alert.alert('Error', 'Unable to logout right now.');
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Profile</Text>

        {isLicenseExpired ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningBannerText}>Your license has expired. Update required.</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.driverInfoRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials || 'DR'}</Text>
            </View>

            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{profile.name}</Text>
              <Text style={styles.driverMeta}>Driver ID: {profile.id}</Text>
              <Text style={styles.driverMeta}>Owner: {profile.ownerName}</Text>
              <Text style={styles.driverMeta}>Vehicle: {profile.vehicleType}</Text>

              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>★ {Number(profile.rating || 0).toFixed(1)}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PerformanceScreen')}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Performance Summary</Text>
            <Text style={styles.sectionAction}>View</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{profile.completedTrips}</Text>
              <Text style={styles.metricLabel}>Trips Completed</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{profile.onTimePercentage}%</Text>
              <Text style={styles.metricLabel}>On-Time %</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{Number(profile.rating || 0).toFixed(1)}</Text>
              <Text style={styles.metricLabel}>Rating</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Document Status</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DocumentsScreen')}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          {documents.map((doc) => {
            const status = resolveDocumentStatus(doc.expiryDate);
            const statusColors = getStatusColors(status);

            return (
              <TouchableOpacity
                key={doc.name}
                style={styles.documentRow}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('DocumentUploadScreen', {
                    documentName: doc.name,
                    expiryDate: doc.expiryDate,
                  })
                }
              >
                <View>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentSubtext}>Expiry: {formatDateLabel(doc.expiryDate)}</Text>
                </View>

                <View style={styles.documentRight}>
                  <View style={[styles.statusBadge, { borderColor: statusColors.borderColor }]}>
                    <Text style={[styles.statusText, { color: statusColors.textColor }]}>{status}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Options</Text>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BankDetailsScreen')}
          >
            <Text style={styles.optionLabel}>Bank Details</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SettingsScreen')}
          >
            <Text style={styles.optionLabel}>Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SupportCenter')}
          >
            <Text style={styles.optionLabel}>Support</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={() => setIsLogoutModalVisible(true)}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={isLogoutModalVisible}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Do you want to logout from this account?</Text>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setIsLogoutModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.confirmButton} onPress={onConfirmLogout}>
                <Text style={styles.confirmButtonText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 16,
  },
  screenTitle: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  warningBanner: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#3A1212',
  },
  warningBannerText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  driverDetails: {
    flex: 1,
    gap: 4,
  },
  driverName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  driverMeta: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  ratingText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedBadge: {
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#0F2A18',
  },
  verifiedBadgeText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionAction: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  documentRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  documentSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  documentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: 20,
    fontWeight: '700',
  },
  optionRow: {
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  optionLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  modalMessage: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});

export default ProfileScreen;
