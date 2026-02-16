import { StyleSheet } from 'react-native';
import { PRIMARY_BLUE, WHITE, DANGER_RED, GRAY_300 } from '../constants/colors';
import { MD } from '../constants/spacing';
import { BUTTON } from '../constants/typography';

const buttonStyles = StyleSheet.create({
  primaryButton: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MD,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: BUTTON,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY_300,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MD,
  },
  dangerButton: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DANGER_RED,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MD,
  },
  buttonDisabled: {
    backgroundColor: GRAY_300,
    borderColor: GRAY_300,
  },
});

export default buttonStyles;
