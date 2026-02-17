import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

const RootStack = createNativeStackNavigator();
const STORAGE_KEYS = {
  isLoggedIn: 'isLoggedIn',
  isKYCCompleted: 'isKYCCompleted',
};

function RootNavigator() {
  const [startupRoute, setStartupRoute] = useState(null);
  const [authInitialScreen, setAuthInitialScreen] = useState('Welcome');

  useEffect(() => {
    let mounted = true;

    const resolveStartupRoute = async () => {
      try {
        const rows = await AsyncStorage.multiGet([
          STORAGE_KEYS.isLoggedIn,
          STORAGE_KEYS.isKYCCompleted,
        ]);
        if (!mounted) {
          return;
        }

        const data = Object.fromEntries(rows);
        const isLoggedIn = data[STORAGE_KEYS.isLoggedIn] === 'true';
        const isKYCCompleted = data[STORAGE_KEYS.isKYCCompleted] === 'true';

        if (!isLoggedIn) {
          setAuthInitialScreen('Welcome');
          setStartupRoute('AuthStack');
          return;
        }

        if (!isKYCCompleted) {
          setAuthInitialScreen('AadhaarKYC');
          setStartupRoute('AuthStack');
          return;
        }

        setStartupRoute('MainTabs');
      } catch (_error) {
        if (mounted) {
          setAuthInitialScreen('Welcome');
          setStartupRoute('AuthStack');
        }
      }
    };

    resolveStartupRoute();

    return () => {
      mounted = false;
    };
  }, []);

  if (!startupRoute) {
    return null;
  }

  return (
    <RootStack.Navigator initialRouteName={startupRoute} screenOptions={{ headerShown: false }}>
      <RootStack.Screen
        name="AuthStack"
        component={AuthStack}
        initialParams={{ initialScreen: authInitialScreen }}
      />
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
    </RootStack.Navigator>
  );
}

export default RootNavigator;
