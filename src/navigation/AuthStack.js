import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import AadhaarKYCScreen from '../screens/auth/AadhaarKYCScreen';
import DLValidationScreen from '../screens/auth/DLValidationScreen';
import FitnessCertificateScreen from '../screens/auth/FitnessCertificateScreen';
import MedicalCertificateScreen from '../screens/auth/MedicalCertificateScreen';
import DailyHealthDeclarationScreen from '../screens/auth/DailyHealthDeclarationScreen';

const Stack = createNativeStackNavigator();

function AuthStack({ route }) {
  const initialScreen = route?.params?.initialScreen === 'AadhaarKYC' ? 'AadhaarKYC' : 'Welcome';

  return (
    <Stack.Navigator initialRouteName={initialScreen} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="AadhaarKYC" component={AadhaarKYCScreen} />
      <Stack.Screen name="DLValidation" component={DLValidationScreen} />
      <Stack.Screen name="FitnessCertificate" component={FitnessCertificateScreen} />
      <Stack.Screen name="MedicalCertificate" component={MedicalCertificateScreen} />
      <Stack.Screen name="DailyHealthDeclaration" component={DailyHealthDeclarationScreen} />
    </Stack.Navigator>
  );
}

export default AuthStack;
