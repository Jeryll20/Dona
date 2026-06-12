import { useRef, useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Animated, TextInput, Keyboard, Platform, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { sendChatMessage, HistoryMessage, PlanningAction, AddActivityAction, UpdateSleepAction } from '@/lib/ai';
import { pushChatMessage, fetchChatHistory } from '@/lib/chatSync';
import { generateWeekPlan, getPlanningWeekStart, type PlanProposal } from '@/lib/planner';
import { upsertActivity } from '@/lib/activitiesSync';
import { genId } from '@/lib/id';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useBehaviorStore } from '@/store/useBehaviorStore';
import { useSuggestionsStore } from '@/store/useSuggestionsStore';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { WeekDay } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'bot' | 'user';

interface Message {
  id:   string;
  role: Role;
  text: string;
  // Interactive week plan — rendered as a card with per-item toggles.
  // Never persisted to the cloud: reasons may mention cycle phases.
  plan?: PlanProposal[];
}

// ── Bubble ────────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
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
        <View style={s.avatar}>
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

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  const C = useColors();
  const s = makeStyles(C);
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
    <View style={[s.bubbleRow, s.bubbleRowBot]}>
      <View style={s.avatar}>
        <Icon name="spark" size={14} stroke={C.primary} />
      </View>
      <View style={[s.bubble, s.bubbleBot, s.typingBubble]}>
        <View style={s.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                s.typingDot,
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
  const C = useColors();
  const s = makeStyles(C);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 280, delay: 120, useNativeDriver: true }).start();
  }, [chips]);

  return (
    <Animated.View style={[s.chipsRow, { opacity }]}>
      {chips.map((c, i) => (
        <TouchableOpacity
          key={i}
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
  const C = useColors();
  const s = makeStyles(C);
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
    <Animated.View style={[s.actionCard, { opacity }]}>
      <View style={s.actionCardBody}>
        <Text style={s.actionCardTitle}>{title}</Text>
        {subtitle ? <Text style={s.actionCardSub}>{subtitle}</Text> : null}
      </View>
      <View style={s.actionCardBtns}>
        <TouchableOpacity
          style={[s.actionBtn, s.actionBtnConfirm]}
          onPress={onConfirm}
          accessibilityLabel="Confirmer"
          accessibilityRole="button"
        >
          <Text style={s.actionBtnConfirmText}>Confirmer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionBtn, s.actionBtnDismiss]}
          onPress={onDismiss}
          accessibilityLabel="Annuler"
          accessibilityRole="button"
        >
          <Text style={s.actionBtnDismissText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

let msgId = 0;
const uid = () => String(++msgId);

const WELCOME_TEXT  = "Bonjour ! Je suis Dona 👋\nComment puis-je t'aider avec ton planning aujourd'hui ?";
const PLAN_CHIP     = '🪄 Planifie ma semaine';
const REROLL_CHIP   = '🪄 Propose autre chose';
const WELCOME_CHIPS = [PLAN_CHIP, "Mon planning ne me correspond pas", "Je veux ajouter une activité"];
const ERROR_TEXT    = "Oups, je n'arrive pas à te répondre pour l'instant. Réessaie dans quelques secondes.";

const FR_DAY: Record<WeekDay, string> = {
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu', Fri: 'Ven', Sat: 'Sam', Sun: 'Dim',
};

// ── PlanCard — interactive week plan inside the conversation ─────────────────

function PlanCard({ items, onApply, onDislike }: {
  items: PlanProposal[];
  onApply: (accepted: PlanProposal[]) => void;
  onDislike: (proposal: PlanProposal) => void;
}) {
  const C = useColors();
  const s = makeStyles(C);
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [hidden,   setHidden]   = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setRejected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const dislike = (p: PlanProposal) => {
    setHidden((prev) => new Set(prev).add(p.id));
    onDislike(p);
  };

  const visible = items.filter((p) => !hidden.has(p.id));
  const acceptedCount = visible.filter((p) => !rejected.has(p.id)).length;

  if (visible.length === 0) {
    return (
      <View style={s.planCard}>
        <Text style={s.planReason}>
          C'est noté, je ne te proposerai plus ces idées. Relance « 🪄 » pour en découvrir d'autres !
        </Text>
      </View>
    );
  }

  return (
    <View style={s.planCard}>
      {visible.map((p) => {
        const off = rejected.has(p.id);
        const d = `${FR_DAY[p.weekDay]} ${p.date.slice(8, 10)}/${p.date.slice(5, 7)}`;
        return (
          <TouchableOpacity
            key={p.id}
            style={[s.planRow, off && s.planRowOff]}
            onPress={() => toggle(p.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !off }}
            accessibilityLabel={`${p.title}, ${d} ${p.startTime}`}
          >
            <View style={[s.planCheck, !off && s.planCheckOn]}>
              {!off && <Icon name="check" size={12} stroke={C.onPrimary} sw={2.5} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.planTitle, off && s.planTextOff]}>{p.title}</Text>
              <Text style={[s.planTime, off && s.planTextOff]}>
                {d} · {p.startTime} – {p.endTime}{p.recurring ? ' · chaque semaine' : ''}
              </Text>
              <Text style={[s.planReason, off && s.planTextOff]}>{p.reason}</Text>
            </View>
            {p.dislikable && (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); dislike(p); }}
                style={s.planDislike}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Ne plus me proposer ${p.title}`}
              >
                <Text style={s.planDislikeText}>👎</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={[s.planApply, acceptedCount === 0 && s.planApplyOff]}
        disabled={acceptedCount === 0}
        onPress={() => onApply(visible.filter((p) => !rejected.has(p.id)))}
        accessibilityRole="button"
        accessibilityLabel={`Appliquer ${acceptedCount} propositions`}
      >
        <Text style={s.planApplyText}>
          Appliquer ({acceptedCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ChatScreen() {
  const C = useColors();
  const s = makeStyles(C);
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
  const planVariant = useRef(0);

  const addActivity  = useScheduleStore((st) => st.addActivity);
  const setSleep     = useUserStore((st) => st.setSleep);
  const userId       = useAuthStore((st) => st.session?.user?.id);

  // Restore conversation history (cloud) — welcome message stays if empty.
  // Inserted between the welcome and any messages already produced this
  // session (e.g. an auto-triggered plan card).
  useEffect(() => {
    if (!userId) return;
    fetchChatHistory(userId).then((history) => {
      if (history.length === 0) return;
      setMessages((prev) => [prev[0], ...history.map((m) => ({ ...m, id: uid() })), ...prev.slice(1)]);
      // Rebuild the Mistral context from the last exchanges
      historyRef.current = history.slice(-12).map((m) => ({
        role:    m.role === 'bot' ? 'assistant' as const : 'user' as const,
        content: m.text,
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Opened with ?plan=1 (weekly report button) → start the planning session
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  useEffect(() => {
    if (planParam === '1') runPlanner();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (userId) pushChatMessage(userId, msg); // cloud history, best-effort
    return msg;
  }

  // ── Interactive week planning (local planner — cycle data never leaves) ─────
  function runPlanner(label: string = PLAN_CHIP) {
    setChips([]);
    pushMessage('user', label);

    const { profile, sleep, meals, cycle } = useUserStore.getState();
    const { activities: acts } = useScheduleStore.getState();
    const { completions } = useBehaviorStore.getState();
    const { dislikedTitles } = useSuggestionsStore.getState();

    const { proposals, adjustments } = generateWeekPlan({
      goal:        profile.goal,
      activities:  acts,
      completions,
      sleep,
      meals,
      cycle,
      weekStart:   getPlanningWeekStart(),
      excludeTitles: dislikedTitles,
      variant:     planVariant.current++, // new draw from the idea pools each run
    });

    if (proposals.length === 0 && adjustments.length === 0) {
      pushMessage('bot', 'Ta semaine est déjà bien remplie, je n\'ai rien à te proposer de plus ! 🎉 Reviens me voir si tu libères des créneaux.');
      return;
    }

    pushMessage('bot', 'Voici ce que je te propose pour ta semaine ✨ Décoche ce qui ne te convient pas, puis applique :');
    // Adjustment notes + plan card added WITHOUT pushChatMessage: they can
    // mention cycle phases — health data that must not reach the cloud history
    setMessages((prev) => [
      ...prev,
      ...adjustments.map((a) => ({ id: uid(), role: 'bot' as Role, text: a.reason })),
      ...(proposals.length > 0 ? [{ id: uid(), role: 'bot' as Role, text: '', plan: proposals }] : []),
    ]);
    setChips([REROLL_CHIP]); // one tap to get a different draw
  }

  function applyPlan(messageId: string, accepted: PlanProposal[]) {
    // Recap + explicit validation before touching the schedule —
    // recurring items change the user's durable routine
    const recurring = accepted.filter((p) => p.recurring);
    const oneOffs   = accepted.filter((p) => !p.recurring);
    const lines = [
      ...(recurring.length > 0
        ? ['Ta routine évolue (chaque semaine) :',
           ...recurring.map((p) => `  ↻ ${p.title} — ${FR_DAY[p.weekDay]} ${p.startTime}`)]
        : []),
      ...(oneOffs.length > 0
        ? [`${recurring.length > 0 ? '\n' : ''}Cette semaine uniquement :`,
           ...oneOffs.map((p) => `  • ${p.title} — ${FR_DAY[p.weekDay]} ${p.date.slice(8, 10)}/${p.date.slice(5, 7)} à ${p.startTime}`)]
        : []),
    ].join('\n');

    Alert.alert(
      'Valider ces changements ?',
      lines,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            for (const p of accepted) {
              const activity = {
                id:         genId(),
                title:      p.title,
                cat:        p.cat,
                startTime:  p.startTime,
                endTime:    p.endTime,
                days:       [p.weekDay],
                recurrence: (p.recurring ? 'weekly' : 'none') as 'weekly' | 'none',
                anchorDate: p.date,
              };
              addActivity(activity);
              if (userId) upsertActivity(userId, activity);
            }
            useBehaviorStore.getState().clearReport();
            // Freeze the card (remove it) and confirm
            setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, plan: undefined, text: '✓ Plan appliqué' } : m)));
            pushMessage('bot', `C'est dans ton planning ! ${accepted.length} ${accepted.length > 1 ? 'créneaux ajoutés' : 'créneau ajouté'} 🎉 Tu peux les déplacer directement sur la timeline si besoin.`);
          },
        },
      ],
    );
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // The planning session is fully local — no Mistral round-trip
    if (trimmed === PLAN_CHIP || trimmed === REROLL_CHIP) {
      setInput('');
      runPlanner(trimmed);
      return;
    }

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
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Logo size={40} />
            <View>
              <Text style={s.headerName}>Dona</Text>
              <Text style={s.headerSub}>Assistante planning</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => router.back()}
            accessibilityLabel="Fermer le chat"
            accessibilityRole="button"
          >
            <Icon name="x" size={20} stroke={C.ink2} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {messages.map((m) => m.plan
            ? (
              <PlanCard
                key={m.id}
                items={m.plan}
                onApply={(accepted) => applyPlan(m.id, accepted)}
                onDislike={(p) => useSuggestionsStore.getState().dislikeTitle(p.title)}
              />
            )
            : <Bubble key={m.id} message={m} />,
          )}
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
        <View style={[s.inputBar, { paddingBottom: Spacing.md + extraBottom }]}>
          <TextInput
            ref={inputRef}
            style={s.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Écris un message…"
            placeholderTextColor={C.ink3}
            multiline
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => send(input)}
            accessibilityLabel="Message"
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            <Icon name="arrow" size={18} stroke={C.onPrimary} />
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: C.hairline,
      backgroundColor: C.surface,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    headerName: { fontSize: FontSize.base, fontWeight: '700', color: C.ink },
    headerSub:  { fontSize: 12.5,          fontWeight: '600', color: C.primaryStrong },
    closeBtn: {
      width: 36, height: 36, borderRadius: Radius.pill,
      backgroundColor: C.surfaceSunk,
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
      backgroundColor: C.primaryTint,
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
      backgroundColor: C.surface,
      borderBottomLeftRadius: 4,
      ...Shadow.sm,
    },
    bubbleUser: {
      backgroundColor: C.primary,
      borderBottomRightRadius: 4,
    },
    bubbleText:     { fontSize: FontSize.md, lineHeight: 22 },
    bubbleTextBot:  { color: C.ink },
    bubbleTextUser: { color: C.onPrimary },

    typingBubble: { paddingVertical: Spacing.base },
    typingDots:   { flexDirection: 'row', gap: 5, alignItems: 'center' },
    typingDot: {
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: C.primary,
    },

    actionCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      backgroundColor: C.primaryTint,
      borderRadius: Radius.block,
      borderWidth: 1,
      borderColor: C.primaryTint2,
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
      color: C.primaryStrong,
    },
    actionCardSub: {
      fontSize: FontSize.sm,
      color: C.primary,
      marginTop: 3,
    },
    actionCardBtns: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: C.primaryTint2,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    actionBtnConfirm: {
      backgroundColor: C.primary,
    },
    actionBtnConfirmText: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: C.onPrimary,
    },
    actionBtnDismiss: {
      backgroundColor: 'transparent',
    },
    actionBtnDismissText: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: C.ink3,
    },

    // Interactive week plan card
    planCard: {
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      marginRight: Spacing.xl,
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    planRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      paddingVertical: 4,
    },
    planRowOff: { opacity: 0.45 },
    planCheck: {
      width: 22, height: 22, borderRadius: 11, marginTop: 2,
      borderWidth: 2, borderColor: C.hairline,
      alignItems: 'center', justifyContent: 'center',
    },
    planCheckOn: { backgroundColor: C.primary, borderColor: C.primary },
    planTitle:   { fontSize: FontSize.base, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
    planTime:    { fontSize: FontSize.sm, fontWeight: '600', color: C.primaryStrong, marginTop: 1 },
    planReason:  { fontSize: FontSize.xs, color: C.ink3, marginTop: 2, lineHeight: 16 },
    planTextOff: { textDecorationLine: 'line-through' },
    planApply: {
      backgroundColor: C.primary,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.sm + 2,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    planApplyOff:  { opacity: 0.45 },
    planApplyText: { fontSize: FontSize.base, fontWeight: '700', color: C.onPrimary },
    planDislike: {
      width: 30, height: 30, borderRadius: 15, marginTop: 2,
      backgroundColor: C.surfaceSunk,
      alignItems: 'center', justifyContent: 'center',
    },
    planDislikeText: { fontSize: 13 },

    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: C.hairline,
    },
    chip: {
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: C.hairline,
      ...Shadow.sm,
    },
    chipText: { fontSize: FontSize.md, fontWeight: '500', color: C.ink },

    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: C.hairline,
      backgroundColor: C.surface,
    },
    textInput: {
      flex: 1,
      backgroundColor: C.background,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.base,
      paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
      maxHeight: 100,
      ...Shadow.sm,
    },
    sendBtn: {
      width: 42, height: 42, borderRadius: Radius.pill,
      backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center',
      ...Shadow.sm,
    },
    sendBtnOff: { opacity: 0.45 },
  });
}
