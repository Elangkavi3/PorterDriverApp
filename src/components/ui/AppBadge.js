import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useLanguage } from '../../i18n/LanguageProvider';

const BADGE_MAP = {
  PAID: 'success',
  UNPAID: 'warning',
  CRITICAL: 'critical',
  COMPLETED: 'success',
  ACTIVE: 'active',
  VALID: 'success',
  EXPIRING: 'warning',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'critical',
  VERIFIED: 'success',
  NOT_UPLOADED: 'critical',
  ROAD_READY: 'success',
  INSPECTION_PENDING: 'warning',
  NEEDS_ATTENTION: 'warning',
  NOT_ROADWORTHY: 'critical',
};

function AppBadge({ label, tone }) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const { tx } = useLanguage();
  const normalized = String(label || '').toUpperCase();
  const resolvedTone = tone || BADGE_MAP[normalized] || 'active';

  const backgroundColor =
    resolvedTone === 'success'
      ? colors.success
      : resolvedTone === 'warning'
        ? colors.warning
        : resolvedTone === 'critical'
          ? colors.critical
          : colors.active;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderRadius: radius.pill,
          minHeight: spacing[4],
          paddingHorizontal: spacing[2],
        },
      ]}
    >
      <Text style={[styles.text, typography.badge, { color: colors.textOnColor }]}>{tx(String(label || ''))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    textTransform: 'none',
  },
});

export default AppBadge;
