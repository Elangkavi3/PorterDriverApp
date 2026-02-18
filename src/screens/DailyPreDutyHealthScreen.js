import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';

const KEYS = {
  dailyHealthCheckDate: 'dailyHealthCheckDate',
  healthClearanceStatus: 'healthClearanceStatus',
  healthAdminApproval: 'healthAdminApproval',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function DailyPreDutyHealthScreen({ navigation }) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [fitForDuty, setFitForDuty] = useState(true);
  const [noSymptoms, setNoSymptoms] = useState(true);

  const submit = async () => {
    if (!fitForDuty || !noSymptoms) {
      await AsyncStorage.multiSet([
        [KEYS.healthClearanceStatus, 'UNFIT'],
        [KEYS.healthAdminApproval, 'PENDING'],
      ]);
      navigation.navigate('NotFitForDuty');
      return;
    }

    await AsyncStorage.multiSet([
      [KEYS.dailyHealthCheckDate, todayStamp()],
      [KEYS.healthClearanceStatus, 'FIT'],
      [KEYS.healthAdminApproval, 'CLEARED'],
    ]);
    navigation.goBack();
  };

  return (
    <AppScreen>
      <AppHeader title="Health Declaration" subtitle="Mandatory daily compliance" />
      <View style={{ paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Confirm each statement before operational access.</Text>

          <TouchableOpacity
            style={{
              minHeight: 48,
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: fitForDuty ? colors.success : colors.border,
              backgroundColor: fitForDuty ? colors.surface : colors.surfaceAlt,
              justifyContent: 'center',
              marginTop: spacing[2],
              paddingHorizontal: spacing[2],
            }}
            onPress={() => setFitForDuty(v => !v)}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {fitForDuty ? 'Checked' : 'Unchecked'}: I am fit for duty.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              minHeight: 48,
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: noSymptoms ? colors.success : colors.border,
              backgroundColor: noSymptoms ? colors.surface : colors.surfaceAlt,
              justifyContent: 'center',
              marginTop: spacing[1],
              paddingHorizontal: spacing[2],
            }}
            onPress={() => setNoSymptoms(v => !v)}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {noSymptoms ? 'Checked' : 'Unchecked'}: No symptoms impacting driving.
            </Text>
          </TouchableOpacity>

          <AppButton title="Submit Declaration" onPress={submit} style={{ marginTop: spacing[2] }} />

          {!fitForDuty || !noSymptoms ? (
            <Text style={[typography.caption, { color: colors.critical, marginTop: spacing[1] }]}>Unsafe declaration will block trip start until admin approval.</Text>
          ) : null}
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default DailyPreDutyHealthScreen;
