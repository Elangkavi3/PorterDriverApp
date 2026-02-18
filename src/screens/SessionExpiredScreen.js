import React from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import { useAppTheme } from '../theme/ThemeProvider';

const KEYS_TO_CLEAR = ['authToken', 'authTokenExpiry', 'isLoggedIn', 'activeTrip', 'tripState'];

function SessionExpiredScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  const relogin = async () => {
    await AsyncStorage.multiRemove(KEYS_TO_CLEAR);
    navigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { initialScreen: 'Login' } }] });
  };

  return (
    <AppScreen>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Session Expired</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Your authentication token has expired. Please log in again.</Text>
          <AppButton title="Login Again" onPress={relogin} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default SessionExpiredScreen;
