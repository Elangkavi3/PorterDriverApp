import { StyleSheet } from 'react-native';
import { DANGER_RED, GRAY_200, GRAY_500, PRIMARY_BLUE, WHITE } from '../constants/colors';
import { SM, MD, XS } from '../constants/spacing';
import { BODY, CAPTION } from '../constants/typography';

const inputStyles = StyleSheet.create({
  inputField: {
    width: '100%',
    borderWidth: 1,
    borderColor: GRAY_200,
    borderRadius: SM,
    paddingHorizontal: MD,
    paddingVertical: SM + 2,
    fontSize: BODY,
    color: GRAY_500,
    backgroundColor: WHITE,
  },
  inputFocused: {
    borderColor: PRIMARY_BLUE,
  },
  inputError: {
    borderColor: DANGER_RED,
  },
  labelText: {
    fontSize: CAPTION,
    color: GRAY_500,
    fontWeight: '600',
    marginBottom: XS,
  },
  errorText: {
    fontSize: CAPTION,
    color: DANGER_RED,
    marginTop: XS,
    fontWeight: '500',
  },
});

export default inputStyles;
