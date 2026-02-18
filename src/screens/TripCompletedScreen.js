import React from 'react';
import { Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';

function TripCompletedScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <AppScreen>
      <AppHeader title="Trip Completed" subtitle="Execution complete" />
      <View style={{ paddingHorizontal: spacing[2] }}>
        <AppCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Step 5 of 5</Text>
            <AppBadge label="COMPLETED" />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Trip lifecycle closed successfully. All states are synchronized.</Text>
          <AppButton title="Back To Dashboard" onPress={() => navigation.navigate('HomeMain')} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default TripCompletedScreen;
