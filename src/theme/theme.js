import { DarkTheme, DefaultTheme } from '@react-navigation/native';

const semantic = {
  primary: '#1E40AF',
  success: '#16A34A',
  warning: '#D97706',
  critical: '#DC2626',
  active: '#1E40AF',
};

export const darkColors = {
  background: '#151A22',
  surface: '#1F2632',
  surfaceAlt: '#273142',
  border: '#334155',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textOnColor: '#FFFFFF',
  icon: '#E2E8F0',
  ...semantic,
};

export const lightColors = {
  background: '#EEF1F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#D0D7E2',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textOnColor: '#FFFFFF',
  icon: '#334155',
  ...semantic,
};

export const appThemes = {
  dark: {
    isDark: true,
    colors: darkColors,
  },
  light: {
    isDark: false,
    colors: lightColors,
  },
};

export function getNavigationTheme(mode) {
  const source = mode === 'light' ? appThemes.light : appThemes.dark;
  const base = source.isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: source.colors.primary,
      background: source.colors.background,
      card: source.colors.surface,
      text: source.colors.textPrimary,
      border: source.colors.border,
      notification: source.colors.critical,
    },
  };
}
