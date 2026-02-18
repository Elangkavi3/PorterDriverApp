import React from 'react';
import { Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

function SplashScreen() {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  return (
    <AppScreen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>{t('brand.appName')}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
          {t('brand.tagline')}
        </Text>
      </View>
    </AppScreen>
  );
}

export default SplashScreen;
