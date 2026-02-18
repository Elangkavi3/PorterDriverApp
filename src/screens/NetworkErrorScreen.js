import React from 'react';
import { Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import { useAppTheme } from '../theme/ThemeProvider';

function NetworkErrorScreen({ onRetry }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <AppScreen>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Network Error</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Unable to load startup state. Check connectivity and retry.</Text>
          <AppButton title="Retry" onPress={onRetry} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default NetworkErrorScreen;
