import React from 'react';
import { Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';

function PickupOTPScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <AppScreen>
      <AppHeader title="Pickup Confirmation" subtitle="OTP verification stage" />
      <View style={{ paddingHorizontal: spacing[2] }}>
        <AppCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Step 2 of 5</Text>
            <AppBadge label="ACTIVE" />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Verify pickup OTP with consignee to continue transit.</Text>
          <AppButton title="Back To Trip" onPress={() => navigation.goBack()} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default PickupOTPScreen;
