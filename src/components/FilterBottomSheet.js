import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const OPTIONS = [
  { label: 'Today', value: 'TODAY' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'This Month', value: 'THIS_MONTH' },
];

function FilterBottomSheet({
  visible,
  selectedRange,
  onSelectRange,
  onApply,
  onClose,
}) {
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 320,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [slideAnim, visible]);

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>Date Range</Text>

        <View style={styles.optionGroup}>
          {OPTIONS.map(option => {
            const isSelected = selectedRange === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.9}
                style={[styles.option, isSelected ? styles.optionSelected : null]}
                onPress={() => onSelectRange(option.value)}
              >
                <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyText}>Apply</Text>
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
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    bottom: 0,
    left: 0,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#4B5563',
    borderRadius: 2,
    height: 4,
    marginBottom: 12,
    width: 52,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionGroup: {
    marginBottom: 14,
    rowGap: 8,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  optionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 56,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FilterBottomSheet;
