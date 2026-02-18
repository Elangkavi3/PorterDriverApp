import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import AppBadge from '../components/ui/AppBadge';
import { useAppTheme } from '../theme/ThemeProvider';
import { VEHICLE_STATUS, getVehicleStatusLabel, getVehicleStatusTone } from '../services/vehicleStatus';

const KEYS = {
  vehicleInspectionDate: 'vehicleInspectionDate',
  vehicleLastInspectionTime: 'vehicleLastInspectionTime',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
  vehicleUnsafeReason: 'vehicleUnsafeReason',
  vehicleOdometer: 'vehicleOdometer',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const CHECKLIST_ITEMS = [
  { key: 'brakes', label: 'Brakes' },
  { key: 'lights', label: 'Lights' },
  { key: 'tires', label: 'Tires' },
  { key: 'mirrors', label: 'Mirrors' },
  { key: 'documents', label: 'Documents' },
];

const IMAGE_SLOTS = ['Front', 'Rear', 'Left', 'Right'];

function VehicleInspectionScreen({ navigation, route }) {
  const { colors, spacing, typography, radius } = useAppTheme();

  const vehicleNumber = route?.params?.vehicleNumber || 'TN-01-AB-1048';

  const [odometer, setOdometer] = useState('');
  const [images, setImages] = useState({
    Front: false,
    Rear: false,
    Left: false,
    Right: false,
  });
  const [checklist, setChecklist] = useState({
    brakes: 'OK',
    lights: 'OK',
    tires: 'OK',
    mirrors: 'OK',
    documents: 'OK',
  });

  const issues = useMemo(
    () => CHECKLIST_ITEMS.filter(item => checklist[item.key] === 'ISSUE').map(item => item.label),
    [checklist],
  );

  const hasIssue = issues.length > 0;
  const hasMajorIssue = checklist.brakes === 'ISSUE';

  const predictedStatus = hasMajorIssue
    ? VEHICLE_STATUS.NOT_ROADWORTHY
    : hasIssue
      ? VEHICLE_STATUS.NEEDS_ATTENTION
      : VEHICLE_STATUS.ROAD_READY;

  const submit = async () => {
    const nowIso = new Date().toISOString();

    await AsyncStorage.multiSet([
      [KEYS.vehicleInspectionDate, todayStamp()],
      [KEYS.vehicleLastInspectionTime, nowIso],
      [KEYS.vehicleSafetyStatus, predictedStatus],
      [KEYS.vehicleUnsafeReason, issues.join(', ')],
      [KEYS.vehicleOdometer, odometer || ''],
    ]);

    if (hasIssue) {
      Alert.alert(
        'Vehicle flagged with issue.',
        hasMajorIssue
          ? 'Major issue detected. Status is Not Roadworthy.'
          : 'Minor issue detected. Status is Needs Attention.',
      );
    } else {
      Alert.alert('Inspection Submitted', 'Vehicle is marked Road Ready.');
    }

    navigation.goBack();
  };

  return (
    <AppScreen>
      <AppHeader title="Vehicle Inspection" subtitle="Mandatory pre-trip checklist" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        <AppCard style={{ marginBottom: spacing[1] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Current Status</Text>
            <AppBadge label={getVehicleStatusLabel(predictedStatus)} tone={getVehicleStatusTone(predictedStatus)} />
          </View>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Vehicle Overview</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Vehicle Number</Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleNumber}</Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Odometer Input</Text>
          <TextInput
            value={odometer}
            onChangeText={text => setOdometer(text.replace(/\D/g, '').slice(0, 9))}
            keyboardType="number-pad"
            placeholder="Enter odometer"
            placeholderTextColor={colors.textSecondary}
            style={{
              minHeight: spacing[6],
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              color: colors.textPrimary,
              paddingHorizontal: spacing[2],
              marginTop: spacing[1],
            }}
          />
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Image Capture</Text>
          <View style={{ marginTop: spacing[1], gap: spacing[1] }}>
            {IMAGE_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot}
                activeOpacity={0.9}
                onPress={() => setImages(prev => ({ ...prev, [slot]: !prev[slot] }))}
                style={{
                  minHeight: 48,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: images[slot] ? colors.success : colors.border,
                  backgroundColor: images[slot] ? colors.surface : colors.surfaceAlt,
                  justifyContent: 'center',
                  paddingHorizontal: spacing[2],
                }}
              >
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  {slot}: {images[slot] ? 'Captured' : 'Tap to capture'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Checklist</Text>
          {CHECKLIST_ITEMS.map(item => {
            const value = checklist[item.key];
            const isIssue = value === 'ISSUE';

            return (
              <View key={item.key} style={{ marginTop: spacing[1] }}>
                <Text style={[typography.label, { color: colors.textPrimary }]}>{item.label}</Text>
                <View style={{ flexDirection: 'row', gap: spacing[1], marginTop: spacing[1] }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setChecklist(prev => ({ ...prev, [item.key]: 'OK' }))}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: value === 'OK' ? colors.success : colors.border,
                      backgroundColor: value === 'OK' ? colors.success : colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={[typography.label, { color: colors.textOnColor }]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setChecklist(prev => ({ ...prev, [item.key]: 'ISSUE' }))}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: isIssue ? colors.warning : colors.border,
                      backgroundColor: isIssue ? colors.warning : colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={[typography.label, { color: colors.textOnColor }]}>Issue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </AppCard>

        <AppButton title="Submit Inspection" onPress={submit} style={{ marginTop: spacing[1] }} />

        {hasIssue ? (
          <Text style={[typography.caption, { color: colors.warning, marginTop: spacing[1] }]}>
            Vehicle flagged with issue.
          </Text>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

export default VehicleInspectionScreen;
