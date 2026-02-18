import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AppScreen from '../../components/ui/AppScreen';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useLanguage } from '../../i18n/LanguageProvider';

function LanguageSelectionScreen({ navigation }) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language || 'en');

  const saveLanguage = async () => {
    await setLanguage(selectedLanguage);
    navigation.replace('Login');
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>{t('language.selectTitle')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('language.chooseDescription')}
          </Text>

          <View style={{ marginTop: spacing[2], gap: spacing[1] }}>
            {supportedLanguages.map(item => {
              const selected = selectedLanguage === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  activeOpacity={0.9}
                  onPress={() => setSelectedLanguage(item.code)}
                  style={{
                    minHeight: spacing[6],
                    borderRadius: radius.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                    justifyContent: 'center',
                    paddingHorizontal: spacing[2],
                  }}
                >
                  <Text style={[typography.label, { color: colors.textOnColor }]}>{item.nativeLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppButton title={t('language.continueToLogin')} onPress={saveLanguage} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

export default LanguageSelectionScreen;
