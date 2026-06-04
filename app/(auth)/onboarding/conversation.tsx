import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

// ── Types ─────────────────────────────────────────────────────────────────────

type FlowStep = 'q1' | 'q2' | 'done';

interface ChatMessage {
  id:   string;
  role: 'bot' | 'user';
  text: string;
}

let msgCounter = 0;
const uid = () => String(++msgCounter);

// ── AnimatedBubble ────────────────────────────────────────────────────────────

function AnimatedBubble({ message }: { message: ChatMessage }) {
  const C = useColors();
  const s = makeStyles(C);
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const isBot = message.role === 'bot';

  return (
    <Animated.View
      style={[
        s.bubbleRow,
        isBot ? s.bubbleRowBot : s.bubbleRowUser,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {isBot && (
        <View style={s.botAvatar}>
          <Icon name="spark" size={15} stroke={C.primary} />
        </View>
      )}
      <View style={[s.bubble, isBot ? s.bubbleBot : s.bubbleUser]}>
        <Text style={[s.bubbleText, isBot ? s.bubbleTextBot : s.bubbleTextUser]}>
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── AnimatedChips ─────────────────────────────────────────────────────────────

function AnimatedChips({
  chips,
  onPick,
}: {
  chips:  string[];
  onPick: (c: string) => void;
}) {
  const C = useColors();
  const s = makeStyles(C);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 260, delay: 100, useNativeDriver: true }).start();
  }, [chips.join(',')]);

  return (
    <Animated.View style={[s.chipsRow, { opacity }]}>
      {chips.map((c) => (
        <TouchableOpacity
          key={c}
          style={s.chip}
          onPress={() => onPick(c)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={c}
        >
          <Text style={s.chipText}>{c}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ConversationScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: 'bot', text: 'Ce planning te correspond ?' },
  ]);
  const [step, setStep] = useState<FlowStep>('q1');

  const chips = step === 'q1' ? ['Oui', 'Non'] : step === 'q2' ? ['Oui', 'Non'] : [];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  function addMessage(role: ChatMessage['role'], text: string) {
    setMessages((prev) => [...prev, { id: uid(), role, text }]);
  }

  function handleChip(answer: string) {
    addMessage('user', answer);

    if (step === 'q1') {
      if (answer === 'Oui') {
        setTimeout(() => {
          addMessage('bot', 'Tu veux ajouter une activité ?');
          setStep('q2');
        }, 400);
      } else {
        setTimeout(() => {
          addMessage('bot', "Qu'est-ce qui ne va pas ?");
          setStep('done');
          setTimeout(() => router.replace('/(tabs)/profile' as any), 1200);
        }, 400);
      }
    } else if (step === 'q2') {
      setStep('done');
      if (answer === 'Oui') {
        setTimeout(() => router.replace('/(tabs)/activities' as any), 700);
      } else {
        setTimeout(() => router.replace('/(tabs)/' as any), 700);
      }
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Logo size={38} />
        <View style={s.headerInfo}>
          <Text style={s.headerName}>Mon assistant</Text>
          <Text style={s.headerStatus}>● en ligne</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <AnimatedBubble key={m.id} message={m} />
        ))}

        {chips.length > 0 && (
          <AnimatedChips chips={chips} onPick={handleChip} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: C.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.hairline,
    },
    headerInfo: { gap: 2 },
    headerName: {
      fontSize: 18,
      fontWeight: '700',
      color: C.ink,
      letterSpacing: -0.3,
    },
    headerStatus: {
      fontSize: 12.5,
      fontWeight: '600',
      color: C.primaryStrong,
    },

    scroll:        { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl,
      gap: Spacing.md,
    },

    bubbleRow:     { flexDirection: 'row', gap: Spacing.sm, maxWidth: '80%' },
    bubbleRowBot:  { alignSelf: 'flex-start', alignItems: 'flex-end' },
    bubbleRowUser: { alignSelf: 'flex-end' },

    botAvatar: {
      width: 28,
      height: 28,
      borderRadius: Radius.pill,
      backgroundColor: C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginBottom: 2,
    },

    bubble: {
      borderRadius: Radius.block,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      flexShrink: 1,
    },
    bubbleBot: {
      backgroundColor: C.primaryTint,
      borderBottomLeftRadius: 4,
    },
    bubbleUser: {
      backgroundColor: C.primary,
      borderBottomRightRadius: 4,
    },
    bubbleText:     { fontSize: FontSize.base, lineHeight: 22 },
    bubbleTextBot:  { color: C.primaryStrong, fontWeight: '500' },
    bubbleTextUser: { color: C.onPrimary, fontWeight: '500' },

    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    chip: {
      backgroundColor: C.surface,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      borderWidth: 1.5,
      borderColor: C.hairline,
      ...Shadow.sm,
    },
    chipText: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: C.ink,
    },
  });
}
