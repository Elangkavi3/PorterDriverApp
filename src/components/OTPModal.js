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
import { BODY, CAPTION, H2 } from '../constants/typography';
import buttonStyles from '../styles/buttonStyles';

function OTPModal({ visible, title, onClose, onConfirm }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const isValidOtp = useMemo(() => otp.length === 6, [otp.length]);

  const handleConfirm = () => {
    if (!isValidOtp) {
      setError('Enter valid 6-digit OTP');
      return;
    }

    setError('');
    onConfirm(otp);
    setOtp('');
  };

  const closeModal = () => {
    setOtp('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeModal}>
      <Pressable style={styles.backdrop} onPress={closeModal}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            value={otp}
            onChangeText={text => {
              setError('');
              setOtp(text.replace(/\D/g, '').slice(0, 6));
            }}
            maxLength={6}
            keyboardType="number-pad"
            placeholder="6-digit OTP"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[buttonStyles.primaryButton, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={buttonStyles.primaryButtonText}>Confirm</Text>
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
    backgroundColor: '#00000099',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#111827',
    padding: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: H2,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    fontSize: BODY,
    paddingHorizontal: 16,
    letterSpacing: 4,
  },
  error: {
    marginTop: 8,
    color: '#DC2626',
    fontSize: CAPTION,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: BODY,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
  },
});

export default OTPModal;
