import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

function SplashScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (!mounted) {
          return;
        }
        if (isLoggedIn === 'true') {
          const parentNavigation = navigation.getParent();
          if (parentNavigation) {
            parentNavigation.replace('MainTabs');
            return;
          }
          navigation.replace('MainTabs');
          return;
        }
        navigation.replace('Login');
      } catch (_error) {
        if (mounted) {
          navigation.replace('Login');
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [navigation]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <Text style={styles.title}>Driver App</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111111',
  },
});

export default SplashScreen;
