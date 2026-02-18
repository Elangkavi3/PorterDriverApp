import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LanguageSelectionScreen from '../screens/auth/LanguageSelectionScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import AadhaarKYCScreen from '../screens/auth/AadhaarKYCScreen';
import DLValidationScreen from '../screens/auth/DLValidationScreen';
import FitnessCertificateScreen from '../screens/auth/FitnessCertificateScreen';
import MedicalCertificateScreen from '../screens/auth/MedicalCertificateScreen';
import OnboardingBankDetailsScreen from '../screens/auth/OnboardingBankDetailsScreen';
import DailyHealthDeclarationScreen from '../screens/auth/DailyHealthDeclarationScreen';

const Stack = createNativeStackNavigator();

function AuthStack({ route }) {
  const allowedInitialScreens = [
    'LanguageSelection',
    'Welcome',
    'Login',
    'AadhaarKYC',
  ];

  const requested = route?.params?.initialScreen;
  const initialScreen = allowedInitialScreens.includes(requested) ? requested : 'Welcome';

  return (
    <Stack.Navigator initialRouteName={initialScreen} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="AadhaarKYC" component={AadhaarKYCScreen} />
      <Stack.Screen name="DLValidation" component={DLValidationScreen} />
      <Stack.Screen name="FitnessCertificate" component={FitnessCertificateScreen} />
      <Stack.Screen name="MedicalCertificate" component={MedicalCertificateScreen} />
      <Stack.Screen name="OnboardingBankDetails" component={OnboardingBankDetailsScreen} />
      <Stack.Screen name="DailyHealthDeclaration" component={DailyHealthDeclarationScreen} />
    </Stack.Navigator>
  );
}

export default AuthStack;
