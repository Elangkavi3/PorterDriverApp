import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import { useAppTheme } from '../theme/ThemeProvider';

function AccessRevokedScreen() {
  const { colors, spacing, typography } = useAppTheme();

  useEffect(() => {
    AsyncStorage.clear().catch(() => {});
  }, []);

  return (
    <AppScreen>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Access Revoked</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Driver access has been deactivated, suspended, or device blocked by admin. Contact control room.</Text>
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default AccessRevokedScreen;
