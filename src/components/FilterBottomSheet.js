import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

const OPTIONS = [
  { label: 'Today', value: 'TODAY' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'This Month', value: 'THIS_MONTH' },
];

function FilterBottomSheet({ visible, selectedRange, onSelectRange, onApply, onClose }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 320,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [slideAnim, visible]);

  return (
    <Modal animationType="fade" transparent statusBarTranslucent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.card,
            borderTopRightRadius: radius.card,
            borderColor: colors.border,
            paddingHorizontal: spacing[2],
            paddingTop: spacing[1],
            paddingBottom: spacing[2],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing[1] }]}>Date Range</Text>

        <View style={{ marginBottom: spacing[1], rowGap: spacing[1] }}>
          {OPTIONS.map(option => {
            const isSelected = selectedRange === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.9}
                style={[
                  styles.option,
                  {
                    borderRadius: radius.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : colors.surfaceAlt,
                    minHeight: spacing[6],
                  },
                ]}
                onPress={() => onSelectRange(option.value)}
              >
                <Text style={[typography.body, { color: '#FFFFFF' }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.applyButton, { minHeight: spacing[6], borderRadius: radius.card, backgroundColor: colors.primary }]}
          onPress={onApply}
        >
          <Text style={[typography.body, { color: '#FFFFFF' }]}>Apply</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginBottom: 12,
    width: 52,
  },
  option: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  applyButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FilterBottomSheet;
