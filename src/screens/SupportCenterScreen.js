import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import OperationalSOSButton from '../components/ui/OperationalSOSButton';
import { useAppTheme } from '../theme/ThemeProvider';

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    sender: 'support',
    message: 'Control room support is online. Share your issue details.',
    time: '09:12',
  },
  {
    id: 'm2',
    sender: 'driver',
    message: 'Need route confirmation for delayed unloading slot.',
    time: '09:13',
  },
];

function SupportCenterScreen({ navigation }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const canSend = useMemo(() => draft.trim().length > 0, [draft]);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const getCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatDuration = value => {
    const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
    const seconds = String(safe % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const sendMessage = () => {
    if (!canSend) {
      return;
    }

    setMessages(prev => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        sender: 'driver',
        message: draft.trim(),
        time: getCurrentTime(),
      },
    ]);
    setDraft('');
  };

  const startRecording = () => {
    setDraft('');
    setRecordingSeconds(0);
    setIsRecording(true);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendRecording = () => {
    setMessages(prev => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        sender: 'driver',
        message: `Audio message (${formatDuration(recordingSeconds)})`,
        time: getCurrentTime(),
      },
    ]);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title="Support" subtitle="Operational communication" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[2] }}>
        <AppCard style={{ marginBottom: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Support Options</Text>
          <View style={{ marginTop: spacing[1], gap: spacing[1] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={{
                minHeight: 48,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                justifyContent: 'center',
                paddingHorizontal: spacing[2],
              }}
            >
              <Text style={[typography.label, { color: colors.textPrimary }]}>Open Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={{
                minHeight: 48,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                justifyContent: 'center',
                paddingHorizontal: spacing[2],
              }}
              onPress={() => navigation.navigate('RaiseTicket')}
            >
              <Text style={[typography.label, { color: colors.textPrimary }]}>Raise Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={{
                minHeight: 48,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                justifyContent: 'center',
                paddingHorizontal: spacing[2],
              }}
              onPress={() => Alert.alert('Call Support', 'Dialer integration placeholder.')}
            >
              <Text style={[typography.label, { color: colors.textPrimary }]}>Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={{
                minHeight: 48,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.critical,
                backgroundColor: colors.critical,
                justifyContent: 'center',
                paddingHorizontal: spacing[2],
              }}
              onPress={() => navigation.navigate('SOSFullScreen')}
            >
              <Text style={[typography.label, { color: '#FFFFFF' }]}>SOS Emergency</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        <AppCard>
          {messages.map(item => {
            const mine = item.sender === 'driver';
            return (
              <View
                key={item.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  backgroundColor: mine ? colors.primary : colors.surfaceAlt,
                  borderColor: colors.border,
                  borderWidth: mine ? 0 : 1,
                  borderRadius: radius.card,
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[1],
                  marginBottom: spacing[1],
                }}
              >
                <Text style={[typography.label, { color: '#FFFFFF' }]}>{item.message}</Text>
                <Text style={[typography.caption, { color: '#FFFFFF', marginTop: spacing[0], opacity: 0.85 }]}>
                  {item.time}
                </Text>
              </View>
            );
          })}
        </AppCard>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: spacing[2],
          paddingBottom: spacing[2],
          paddingTop: spacing[1],
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            minHeight: spacing[6],
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing[1],
            gap: spacing[1],
          }}
        >
          {isRecording ? (
            <>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: spacing[1],
                    height: spacing[1],
                    borderRadius: spacing[1] / 2,
                    backgroundColor: colors.critical,
                    marginRight: spacing[1],
                  }}
                />
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  {formatDuration(recordingSeconds)}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={cancelRecording}
                style={{
                  minHeight: 48,
                  minWidth: 72,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Text style={[typography.label, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={sendRecording}
                style={{
                  minHeight: 48,
                  minWidth: 72,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={[typography.label, { color: '#FFFFFF' }]}>Send</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Write an operational message"
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, color: colors.textPrimary }}
              />
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={startRecording}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Text style={[typography.label, { color: colors.textPrimary }]}>Mic</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!canSend}
                onPress={sendMessage}
                style={{
                  minHeight: 48,
                  minWidth: 72,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: canSend ? colors.primary : colors.border,
                }}
              >
                <Text style={[typography.label, { color: '#FFFFFF' }]}>Send</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <OperationalSOSButton onPress={() => navigation.navigate('SOSFullScreen')} />
    </AppScreen>
  );
}

export default SupportCenterScreen;
