import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NotificationIcon from '../../assets/icons/NotificationIcon.svg';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useLanguage } from '../../i18n/LanguageProvider';

function AppHeader({ title, subtitle, rightSlot }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { tx } = useLanguage();

  return (
    <View style={[styles.row, { paddingHorizontal: spacing[2], paddingVertical: spacing[1] }]}> 
      <View style={styles.left}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>{tx(title)}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>{tx(subtitle)}</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.iconButton,
            {
              borderRadius: radius.pill,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              minHeight: spacing[6],
              minWidth: spacing[6],
            },
          ]}
        >
          <NotificationIcon width={18} height={18} color={colors.icon} />
        </TouchableOpacity>
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});

export default AppHeader;
