import React from 'react';
import { Alert, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';

const INCIDENTS_KEY = 'sosIncidents';

function SOSFullScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  const logIncident = async () => {
    const payload = {
      id: `SOS-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'RAISED',
    };

    try {
      const raw = await AsyncStorage.getItem(INCIDENTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const nextList = Array.isArray(list) ? [payload, ...list] : [payload];
      await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(nextList));
    } catch (_error) {
      // Keep emergency action resilient even if local logging fails.
    }

    Alert.alert(
      'Emergency Triggered',
      'Call and alert placeholder executed. Incident logged locally.',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <AppScreen>
      <AppHeader title="Emergency SOS" subtitle="Critical action confirmation" />
      <View style={{ paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.body, { color: colors.textPrimary }]}>Confirm emergency activation. This action triggers call + alert placeholders and logs an incident.</Text>
          <AppButton title="Confirm Emergency" onPress={logIncident} style={{ marginTop: spacing[2], backgroundColor: colors.critical }} />
          <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} style={{ marginTop: spacing[1] }} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default SOSFullScreen;
