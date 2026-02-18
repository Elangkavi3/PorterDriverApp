import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppScreen from './ui/AppScreen';
import AppHeader from './ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';

function PlaceholderPage({ title }) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={title} subtitle="Under active refactor" />
      <View style={[styles.container, { paddingHorizontal: spacing[2] }]}> 
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          This module is available and will follow the enterprise design system.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PlaceholderPage;
