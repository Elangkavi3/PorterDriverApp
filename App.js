import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { getNavigationTheme } from './src/theme/theme';
import { OperationsProvider } from './src/runtime/OperationsProvider';
import { LanguageProvider } from './src/i18n/LanguageProvider';

function NavigationShell() {
  const { isDark, mode, colors } = useAppTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <NavigationContainer theme={getNavigationTheme(mode)}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppThemeProvider>
          <OperationsProvider>
            <NavigationShell />
          </OperationsProvider>
        </AppThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
