import { useRef, useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Animated, TextInput, Keyboard, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { sendChatMessage, HistoryMessage, PlanningAction, AddActivityAction, UpdateSleepAction } from '@/lib/ai';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useUserStore } from '@/store/useUserStore';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'bot' | 'user';

interface Message {
  id:   string;
  role: Role;
  text: string;
}

// ── Bubble ────────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
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
        styles.bubbleRow,
        isBot ? styles.bubbleRowBot : styles.bubbleRowUser,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {isBot && (
        <View style={styles.avatar}>
          <Icon name="spark" size={15} stroke={Colors.light.primary} />
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

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(560 - i * 140),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
      <View style={styles.avatar}>
        <Icon name="spark" size={14} stroke={Colors.light.primary} />
      </View>
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.typingDot,
                {
                  opacity: dot,
                  transform: [
                    { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Quick chips ───────────────────────────────────────────────────────────────

function QuickChips({
  chips,
  onPick,
}: {
  chips:  string[];
  onPick: (c: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 280, delay: 120, useNativeDriver: true }).start();
  }, [chips]);

  return (
    <Animated.View style={[styles.chipsRow, { opacity }]}>
      {chips.map((c, i) => (
        <TouchableOpacity
          key={i}
          style={styles.chip}
          onPress={() => onPick(c)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={c}
        >
          <Text style={styles.chipText}>{c}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

// ── Action card ───────────────────────────────────────────────────────────────

const DAY_FR: Record<string, string> = {
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu',
  Fri: 'Ven', Sat: 'Sam', Sun: 'Dim',
};

function ActionCard({
  action,
  onConfirm,
  onDismiss,
}: {
  action:    PlanningAction;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  let title = '';
  let subtitle = '';

  if (action.type === 'add_activity') {
    const p = (action as AddActivityAction).payload;
    title    = p.title;
    const days = p.days.length === 7 ? 'Tous les jours' : p.days.map((d) => DAY_FR[d] ?? d).join(', ');
    subtitle = `${days} · ${p.startTime} → ${p.endTime}`;
  } else if (action.type === 'update_sleep') {
    const p = (action as UpdateSleepAction).payload;
    title    = 'Modifier le sommeil';
    const parts: string[] = [];
    if (p.waketime)    parts.push(`Réveil ${p.waketime}`);
    if (p.bedtime)     parts.push(`Coucher ${p.bedtime}`);
    if (p.prepMinutes) parts.push(`Prépa ${p.prepMinutes} min`);
    subtitle = parts.join(' · ');
  }

  return (
    <Animated.View style={[styles.actionCard, { opacity }]}>
      <View style={styles.actionCardBody}>
        <Text style={styles.actionCardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionCardSub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actionCardBtns}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnConfirm]}
          onPress={onConfirm}
          accessibilityLabel="Confirmer"
          accessibilityRole="button"
        >
          <Text style={styles.actionBtnConfirmText}>Confirmer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDismiss]}
          onPress={onDismiss}
          accessibilityLabel="Annuler"
          accessibilityRole="button"
        >
          <Text style={styles.actionBtnDismissText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

let msgId = 0;
const uid = () => String(++msgId);

const WELCOME_TEXT  = "Bonjour ! Je suis Dona 👋\nComment puis-je t'aider avec ton planning aujourd'hui ?";
const WELCOME_CHIPS = ["Mon planning ne me correspond pas", "Je veux ajouter une activité", "Comment fonctionne Dona ?"];
const ERROR_TEXT    = "Oups, je n'arrive pas à te répondre pour l'instant. Réessaie dans quelques secondes.";

export default function ChatScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const inputRef  = useRef<TextInput>(null);
  const insets    = useSafeAreaInsets();
  const [kbHeight, setKbHeight] = useState(0);

  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: 'bot', text: WELCOME_TEXT },
  ]);
  const [chips,         setChips]         = useState<string[]>(WELCOME_CHIPS);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [pendingAction, setPendingAction] = useState<PlanningAction | null>(null);
  const historyRef = useRef<HistoryMessage[]>([]);

  const addActivity  = useScheduleStore((s) => s.addActivity);
  const setSleep     = useUserStore((s) => s.setSleep);

  function executeAction(action: PlanningAction) {
    if (action.type === 'add_activity') {
      const p = (action as AddActivityAction).payload;
      addActivity({
        id:         Date.now().toString(),
        title:      p.title,
        cat:        p.cat,
        startTime:  p.startTime,
        endTime:    p.endTime,
        days:       p.days,
        recurrence: p.recurrence,
      });
      pushMessage('bot', `C'est ajouté ! "${p.title}" apparaît maintenant dans ton planning. 🎉`);
    } else if (action.type === 'update_sleep') {
      const p = (action as UpdateSleepAction).payload;
      setSleep(p);
      pushMessage('bot', 'Ton sommeil a été mis à jour ! ✨');
    }
    setPendingAction(null);
    setChips([]);
  }

  function dismissAction() {
    setPendingAction(null);
    setChips([]);
    pushMessage('bot', "Pas de problème, dis-moi si tu veux modifier autre chose !");
  }

  function pushMessage(role: Role, text: string): Message {
    const msg: Message = { id: uid(), role, text };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setChips([]);
    pushMessage('user', trimmed);
    setLoading(true);

    const currentHistory = [...historyRef.current];
    historyRef.current   = [...currentHistory, { role: 'user', content: trimmed }];

    try {
      const res = await sendChatMessage(trimmed, currentHistory);
      setLoading(false);
      pushMessage('bot', res.message);
      setChips(res.chips ?? []);
      setPendingAction(res.action ?? null);

      historyRef.current = [...historyRef.current, { role: 'assistant', content: res.message }];

      if (res.navigate && !res.action) {
        setTimeout(() => {
          router.back();
          router.push(res.navigate as any);
        }, 900);
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[chat] send error:', errMsg);
      pushMessage('bot', `Erreur : ${errMsg}`);
      setChips([]);
    }
  }

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const extraBottom = Math.max(0, kbHeight - insets.bottom);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Logo size={40} />
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {messages.map((m) => <Bubble key={m.id} message={m} />)}
          {loading && <TypingIndicator />}
        </ScrollView>

        {/* Action confirmation card */}
        {pendingAction && !loading && (
          <ActionCard
            action={pendingAction}
            onConfirm={() => executeAction(pendingAction)}
            onDismiss={dismissAction}
          />
        )}

        {/* Quick chips */}
        {chips.length > 0 && !loading && (
          <QuickChips chips={chips} onPick={(c) => send(c)} />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Spacing.md + extraBottom }]}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Écris un message…"
            placeholderTextColor={Colors.light.ink3}
            multiline
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => send(input)}
            accessibilityLabel="Message"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            <Icon name="arrow" size={18} stroke={Colors.light.onPrimary} />
          </TouchableOpacity>
        </View>
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
  headerName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink },
  headerSub:  { fontSize: 12.5,          fontWeight: '600', color: Colors.light.primaryStrong },
  closeBtn: {
    width: 36, height: 36, borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },

  bubbleRow:     { flexDirection: 'row', gap: Spacing.sm, maxWidth: '85%' },
  bubbleRowBot:  { alignSelf: 'flex-start' },
  bubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

  avatar: {
    marginTop: 2,
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
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

  typingBubble: { paddingVertical: Spacing.base },
  typingDots:   { flexDirection: 'row', gap: 5, alignItems: 'center' },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },

  actionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.block,
    borderWidth: 1,
    borderColor: Colors.light.primaryTint2,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  actionCardBody: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  actionCardTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.light.primaryStrong,
  },
  actionCardSub: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    marginTop: 3,
  },
  actionCardBtns: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.light.primaryTint2,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  actionBtnConfirm: {
    backgroundColor: Colors.light.primary,
  },
  actionBtnConfirmText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.onPrimary,
  },
  actionBtnDismiss: {
    backgroundColor: 'transparent',
  },
  actionBtnDismissText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.ink3,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
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
  chipText: { fontSize: FontSize.md, fontWeight: '500', color: Colors.light.ink },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.hairline,
    backgroundColor: Colors.light.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.base,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
    maxHeight: 100,
    ...Shadow.sm,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: Radius.pill,
    backgroundColor: Colors.light.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  sendBtnOff: { opacity: 0.45 },
});
