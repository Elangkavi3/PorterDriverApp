import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useOperations } from '../../runtime/OperationsProvider';
import OfflineBanner from './OfflineBanner';

function AppScreen({ children, edges = ['top', 'bottom'], style }) {
  const { colors, isDark } = useAppTheme();
  const { isOffline } = useOperations();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }, style]} edges={edges}>
      <StatusBar
        translucent={false}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {isOffline ? <OfflineBanner /> : null}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default AppScreen;
