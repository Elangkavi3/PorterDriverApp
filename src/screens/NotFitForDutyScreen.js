import React from 'react';
import { Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';

function NotFitForDutyScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <AppScreen>
      <AppHeader title="Not Fit for Duty" subtitle="Compliance block" />
      <View style={{ paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.body, { color: colors.textPrimary }]}>Health declaration is flagged as unsafe. Trip start remains blocked until admin approval.</Text>
          <AppButton title="Back to Dashboard" onPress={() => navigation.navigate('HomeMain')} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default NotFitForDutyScreen;
