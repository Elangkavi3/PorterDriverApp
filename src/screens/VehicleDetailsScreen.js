import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';
import { getVehicleStatusLabel, getVehicleStatusTone, normalizeVehicleStatus } from '../services/vehicleStatus';

const KEYS = {
  profile: 'driverProfile',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
  vehicleInspectionDate: 'vehicleInspectionDate',
  vehicleLastInspectionTime: 'vehicleLastInspectionTime',
  vehicleFuelLevel: 'vehicleFuelLevel',
};

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function formatDateLabel(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${day}/${month}/${year} ${hh}:${mm}`;
}

function VehicleDetailsScreen() {
  const { colors, spacing, typography } = useAppTheme();
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleNumber: 'TN-01-AB-1048',
    vehicleModel: 'Ashok Leyland 16ft',
    insuranceExpiry: '2026-12-31',
    fcExpiry: '2026-10-15',
    fuelLevel: '68%',
    lastInspection: '',
    status: 'INSPECTION_PENDING',
  });

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function hydrate() {
        const rows = await AsyncStorage.multiGet([
          KEYS.profile,
          KEYS.vehicleSafetyStatus,
          KEYS.vehicleInspectionDate,
          KEYS.vehicleLastInspectionTime,
          KEYS.vehicleFuelLevel,
        ]);

        if (!mounted) {
          return;
        }

        const data = Object.fromEntries(rows);
        const profile = parseJson(data[KEYS.profile], {});

        const lastInspectionRaw = data[KEYS.vehicleLastInspectionTime] || data[KEYS.vehicleInspectionDate] || '';
        const normalizedStatus = normalizeVehicleStatus(data[KEYS.vehicleSafetyStatus]);

        setVehicleInfo({
          vehicleNumber: profile.vehicleNumber || 'TN-01-AB-1048',
          vehicleModel: profile.vehicleModel || profile.vehicleType || 'Ashok Leyland 16ft',
          insuranceExpiry: profile.insuranceExpiry || '2026-12-31',
          fcExpiry: profile.fcExpiry || '2026-10-15',
          fuelLevel: data[KEYS.vehicleFuelLevel] || '68%',
          lastInspection: formatDateLabel(lastInspectionRaw),
          status: normalizedStatus,
        });
      }

      hydrate();

      return () => {
        mounted = false;
      };
    }, []),
  );

  return (
    <AppScreen>
      <AppHeader title="Vehicle Details" subtitle="Fleet compliance record" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        <AppCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{vehicleInfo.vehicleNumber}</Text>
            <AppBadge
              label={getVehicleStatusLabel(vehicleInfo.status)}
              tone={getVehicleStatusTone(vehicleInfo.status)}
            />
          </View>

          <View style={{ marginTop: spacing[2], gap: spacing[1] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Vehicle Model</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleInfo.vehicleModel}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Insurance Expiry</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleInfo.insuranceExpiry}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>FC Expiry</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleInfo.fcExpiry}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Fuel Level</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleInfo.fuelLevel}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Last Inspection</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleInfo.lastInspection}</Text>
            </View>
          </View>
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

export default VehicleDetailsScreen;
