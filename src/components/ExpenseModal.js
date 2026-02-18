import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FuelIcon from './icons/FuelIcon';
import TollIcon from './icons/TollIcon';
import { useAppTheme } from '../theme/ThemeProvider';

const CATEGORIES = [
  { key: 'Fuel', Icon: FuelIcon },
  { key: 'Toll', Icon: TollIcon },
];

function ExpenseModal({ visible, onClose, onSave }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const [category, setCategory] = useState('Fuel');
  const [amount, setAmount] = useState('');

  const parsedAmount = useMemo(() => Number(amount), [amount]);
  const isSaveDisabled = Number.isNaN(parsedAmount) || parsedAmount <= 0;

  const handleSave = () => {
    if (isSaveDisabled) {
      return;
    }

    onSave({
      id: `EXP-${Date.now()}`,
      category,
      amount: Number(parsedAmount.toFixed(2)),
      createdAt: new Date().toISOString(),
    });

    setCategory('Fuel');
    setAmount('');
  };

  const handleClose = () => {
    setCategory('Fuel');
    setAmount('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.card,
              borderTopRightRadius: radius.card,
              borderColor: colors.border,
              padding: spacing[2],
            },
          ]}
          onPress={() => {}}
        >
          <Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing[1] }]}>Log Expense</Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1] }]}>Category</Text>
          <View style={[styles.categoryRow, { marginBottom: spacing[1] }]}>
            {CATEGORIES.map(item => {
              const isSelected = category === item.key;
              const IconComponent = item.Icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.9}
                  style={[
                    styles.categoryChip,
                    {
                      minHeight: spacing[6],
                      borderRadius: radius.pill,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : colors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setCategory(item.key)}
                >
                  <IconComponent size={18} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                  <Text style={[typography.label, { color: '#FFFFFF', marginLeft: spacing[1] }]}>{item.key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1] }]}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                borderRadius: radius.card,
                color: colors.textPrimary,
                minHeight: spacing[6],
                paddingHorizontal: spacing[2],
              },
            ]}
          />

          <View style={[styles.actions, { marginTop: spacing[2], gap: spacing[1] }]}> 
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.cancelButton,
                {
                  minHeight: spacing[6],
                  borderRadius: radius.card,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}
              onPress={handleClose}
            >
              <Text style={[typography.body, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isSaveDisabled}
              style={[
                styles.saveButton,
                {
                  minHeight: spacing[6],
                  borderRadius: radius.card,
                  backgroundColor: isSaveDisabled ? colors.border : colors.primary,
                },
              ]}
              onPress={handleSave}
            >
              <Text style={[typography.body, { color: '#FFFFFF' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'flex-end',
  },
  container: {
    borderWidth: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minWidth: 108,
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExpenseModal;
