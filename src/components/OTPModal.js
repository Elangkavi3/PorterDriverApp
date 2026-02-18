import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

function OTPModal({ visible, title, onClose, onConfirm }) {
  const { colors, spacing, radius, typography } = useAppTheme();
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
        <Pressable
          style={[
            styles.card,
            {
              borderRadius: radius.card,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: spacing[2],
            },
          ]}
          onPress={() => {}}
        >
          <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing[1] }]}>{title}</Text>
          <TextInput
            value={otp}
            onChangeText={text => {
              setError('');
              setOtp(text.replace(/\D/g, '').slice(0, 6));
            }}
            maxLength={6}
            keyboardType="number-pad"
            placeholder="6-digit OTP"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              },
            ]}
          />
          {error ? <Text style={[typography.caption, { marginTop: spacing[1], color: colors.critical }]}>{error}</Text> : null}

          <View style={[styles.actionRow, { gap: spacing[1], marginTop: spacing[2] }]}> 
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  minHeight: spacing[6],
                  borderRadius: radius.card,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}
              onPress={closeModal}
            >
              <Text style={[typography.body, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { minHeight: spacing[6], borderRadius: radius.card, backgroundColor: colors.primary },
              ]}
              onPress={handleConfirm}
            >
              <Text style={[typography.body, { color: '#FFFFFF' }]}>Confirm</Text>
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
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    letterSpacing: 4,
  },
  actionRow: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OTPModal;
