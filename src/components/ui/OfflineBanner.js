import React from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

function OfflineBanner() {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View
      style={{
        minHeight: 40,
        backgroundColor: colors.warning,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        justifyContent: 'center',
        paddingHorizontal: spacing[2],
      }}
    >
      <Text style={[typography.caption, { color: '#FFFFFF' }]}>Offline Mode: Live submissions are paused. Showing last synced operational data.</Text>
    </View>
  );
}

export default OfflineBanner;
