import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FuelIcon from './icons/FuelIcon';
import TollIcon from './icons/TollIcon';

const CATEGORIES = [
  { key: 'Fuel', Icon: FuelIcon },
  { key: 'Toll', Icon: TollIcon },
];

function ExpenseModal({ visible, onClose, onSave }) {
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <Text style={styles.title}>Log Expense</Text>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(item => {
              const isSelected = category === item.key;
              const IconComponent = item.Icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.9}
                  style={[
                    styles.categoryChip,
                    isSelected ? styles.categoryChipSelected : null,
                  ]}
                  onPress={() => setCategory(item.key)}
                >
                  <IconComponent size={18} color={isSelected ? '#FFFFFF' : '#9CA3AF'} />
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected ? styles.categoryTextSelected : null,
                    ]}
                  >
                    {item.key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isSaveDisabled}
              style={[
                styles.saveButton,
                isSaveDisabled ? styles.saveButtonDisabled : null,
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Save</Text>
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
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 48,
    minWidth: 108,
    paddingHorizontal: 12,
  },
  categoryChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
    borderRadius: 16,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 56,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
  },
  saveButtonDisabled: {
    backgroundColor: '#374151',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ExpenseModal;
