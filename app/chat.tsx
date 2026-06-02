import { useRef, useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CHAT_TREE, ChatChoice } from '@/lib/chatTree';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'bot' | 'user';

interface Message {
  id:   string;
  role: Role;
  text: string;
}

// ── Bubble ────────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const isBot = message.role === 'bot';

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isBot ? styles.bubbleRowBot : styles.bubbleRowUser,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {isBot && (
        <View style={styles.avatar}>
          <Icon name="spark" size={14} stroke={Colors.light.primary} />
        </View>
      )}
      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, isBot ? styles.bubbleTextBot : styles.bubbleTextUser]}>
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Choice chips ──────────────────────────────────────────────────────────────

function ChoiceChips({
  choices,
  onPick,
}: {
  choices: ChatChoice[];
  onPick:  (c: ChatChoice) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 280, delay: 160, useNativeDriver: true }).start();
  }, [choices]);

  return (
    <Animated.View style={[styles.chips, { opacity }]}>
      {choices.map((c, i) => (
        <TouchableOpacity
          key={i}
          style={styles.chip}
          onPress={() => onPick(c)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={c.label}
        >
          <Text style={styles.chipText}>{c.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

let msgId = 0;
const uid = () => String(++msgId);

export default function ChatScreen() {
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: 'bot', text: CHAT_TREE.welcome.message },
  ]);
  const [currentNode, setCurrentNode] = useState('welcome');

  function addMessage(msg: Omit<Message, 'id'>) {
    setMessages((prev) => [...prev, { ...msg, id: uid() }]);
  }

  function handleChoice(choice: ChatChoice) {
    // Show the user's choice as a message
    addMessage({ role: 'user', text: choice.label });

    const { action } = choice;

    if (action.type === 'next') {
      const node = CHAT_TREE[action.node];
      setTimeout(() => {
        addMessage({ role: 'bot', text: node.message });
        setCurrentNode(action.node);
      }, 350);
    } else if (action.type === 'navigate') {
      setTimeout(() => {
        router.back();
        router.push(action.route as any);
      }, 300);
    } else {
      setTimeout(() => router.back(), 300);
    }
  }

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  const currentChoices = CHAT_TREE[currentNode]?.choices ?? [];
  const lastIsBot = messages[messages.length - 1]?.role === 'bot';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Icon name="spark" size={18} stroke={Colors.light.primary} />
          </View>
          <View>
            <Text style={styles.headerName}>Dona</Text>
            <Text style={styles.headerSub}>Assistante planning</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          accessibilityLabel="Fermer le chat"
          accessibilityRole="button"
        >
          <Icon name="x" size={20} stroke={Colors.light.ink2} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => <Bubble key={m.id} message={m} />)}
      </ScrollView>

      {/* Choices — only shown after the bot's last message */}
      {lastIsBot && (
        <ChoiceChips choices={currentChoices} onPick={handleChoice} />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.hairline,
    backgroundColor: Colors.light.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink },
  headerSub:  { fontSize: FontSize.sm,   fontWeight: '500', color: Colors.light.ink3 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },

  bubbleRow:     { flexDirection: 'row', gap: Spacing.sm, maxWidth: '85%' },
  bubbleRowBot:  { alignSelf: 'flex-start' },
  bubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },

  bubble: {
    borderRadius: Radius.block,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexShrink: 1,
  },
  bubbleBot: {
    backgroundColor: Colors.light.surface,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText:     { fontSize: FontSize.md, lineHeight: 22 },
  bubbleTextBot:  { color: Colors.light.ink },
  bubbleTextUser: { color: Colors.light.onPrimary },

  chips: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.hairline,
  },
  chip: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.hairline,
    ...Shadow.sm,
  },
  chipText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.light.ink,
  },
});
