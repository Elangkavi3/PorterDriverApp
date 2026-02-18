import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../../components/ui/AppScreen';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import { useAppTheme } from '../../theme/ThemeProvider';

const BANK_DETAILS_KEY = 'driverBankDetails';
const PROFILE_KEY = 'driverProfile';

function OnboardingBankDetailsScreen({ navigation }) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const isValid = useMemo(
    () =>
      accountHolderName.trim().length > 2 &&
      bankName.trim().length > 2 &&
      accountNumber.trim().length >= 6 &&
      ifscCode.trim().length >= 8,
    [accountHolderName, bankName, accountNumber, ifscCode],
  );

  const saveAndContinue = async () => {
    if (!isValid) {
      Alert.alert('Incomplete Details', 'Fill all required bank details.');
      return;
    }

    const payload = {
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(payload));

    const rawProfile = await AsyncStorage.getItem(PROFILE_KEY);
    const profile = rawProfile ? JSON.parse(rawProfile) : {};
    const nextProfile = {
      ...profile,
      name: profile.name || accountHolderName.trim(),
      bankName: payload.bankName,
      accountMasked: `XXXXXX${payload.accountNumber.slice(-4)}`,
      ifsc: payload.ifscCode,
    };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));

    navigation.navigate('DailyHealthDeclaration');
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        <AppCard>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Bank Details</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>Required for payment settlement setup.</Text>

          <View style={{ marginTop: spacing[2], gap: spacing[1] }}>
            <TextInput
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholder="Account holder name"
              placeholderTextColor={colors.textSecondary}
              style={{
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              }}
            />
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="Bank name"
              placeholderTextColor={colors.textSecondary}
              style={{
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              }}
            />
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Account number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={{
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              }}
            />
            <TextInput
              value={ifscCode}
              onChangeText={setIfscCode}
              placeholder="IFSC"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              style={{
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              }}
            />
          </View>

          <AppButton title="Continue" onPress={saveAndContinue} disabled={!isValid} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

export default OnboardingBankDetailsScreen;
