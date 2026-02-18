import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

function OperationalSOSButton({ onPress }) {
  const { colors, radius, spacing, typography } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.critical,
          borderRadius: radius.pill,
          minHeight: spacing[6],
          minWidth: spacing[6],
          right: spacing[2],
          bottom: spacing[3],
        },
      ]}
    >
      <Text style={[typography.label, styles.text]}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 40,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

export default OperationalSOSButton;
