import { StyleSheet } from 'react-native';
import { GRAY_200, BLACK, WHITE } from '../constants/colors';
import { MD } from '../constants/spacing';

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  card: {
    borderWidth: 1,
    borderColor: GRAY_200,
    borderRadius: 14,
    backgroundColor: WHITE,
    padding: MD,
  },
  shadowLight: {
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default globalStyles;
