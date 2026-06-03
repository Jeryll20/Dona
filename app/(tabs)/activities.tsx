import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TimeField } from '@/components/ui/TimeField';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { CatKey, UserActivity, WeekDay, Recurrence } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type Step = 1 | 2 | 3;

// ── Data ──────────────────────────────────────────────────────────

const CATEGORIES: { key: CatKey; label: string; icon: IoniconsName; bg: string; ink: string }[] = [
  { key: 'travail',  label: 'Travail',        icon: 'briefcase-outline',     bg: Colors.light.workBg,     ink: Colors.light.workInk },
  { key: 'activite', label: 'Sport / Activité', icon: 'walk-outline',         bg: Colors.light.activityBg, ink: Colors.light.activityInk },
  { key: 'repas',    label: 'Repas',          icon: 'restaurant-outline',    bg: Colors.light.mealBg,     ink: Colors.light.mealInk },
  { key: 'trajet',   label: 'Trajet',         icon: 'car-outline',           bg: Colors.light.transitBg,  ink: Colors.light.transitInk },
];

const WEEK_DAYS: { key: WeekDay; label: string }[] = [
  { key: 'Mon', label: 'L'  },
  { key: 'Tue', label: 'Ma' },
  { key: 'Wed', label: 'Me' },
  { key: 'Thu', label: 'J'  },
  { key: 'Fri', label: 'V'  },
  { key: 'Sat', label: 'S'  },
  { key: 'Sun', label: 'D'  },
];

const FR_DAY: Record<WeekDay, string> = {
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu', Fri: 'Ven', Sat: 'Sam', Sun: 'Dim',
};

const RECURRENCES: { key: Recurrence; label: string; sub: string }[] = [
  { key: 'weekly',   label: 'Chaque semaine',       sub: 'Se répète toutes les semaines' },
  { key: 'biweekly', label: 'Toutes les deux semaines', sub: 'Une semaine sur deux' },
  { key: 'none',     label: 'Ponctuel',              sub: 'Ne se répète pas' },
];

const SHEET_HEIGHT = 650;

// ── Helpers ───────────────────────────────────────────────────────


function formatDays(days: WeekDay[]): string {
  if (days.length === 0) return 'Aucun jour';
  if (days.length === 7) return 'Tous les jours';
  return days.map((d) => FR_DAY[d]).join(', ');
}

// ── TimePickerRow ─────────────────────────────────────────────────

function TimePickerRow({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={tpS.wrap}>
      <Text style={tpS.label}>{label}</Text>
      <TimeField value={value} onChange={onChange} />
    </View>
  );
}

const tpS = StyleSheet.create({
  wrap:  { alignItems: 'center', flex: 1 },
  label: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.light.ink3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ── ActivityCard ──────────────────────────────────────────────────

type ActivityCardData = Pick<UserActivity, 'id' | 'title' | 'cat' | 'startTime' | 'endTime' | 'days'>;

function ActivityCard({ activity, onEdit, onDelete }: {
  activity: ActivityCardData;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === activity.cat) ?? CATEGORIES[1];
  return (
    <TouchableOpacity
      style={cS.wrap}
      onPress={onEdit}
      activeOpacity={0.75}
      accessibilityLabel={activity.title}
      accessibilityRole="button"
    >
      <View style={[cS.icon, { backgroundColor: cat.bg }]}>
        <Ionicons name={cat.icon} size={20} color={cat.ink} />
      </View>
      <View style={cS.content}>
        <Text style={cS.title}>{activity.title}</Text>
        <Text style={cS.sub}>{activity.startTime} – {activity.endTime} · {formatDays(activity.days)}</Text>
      </View>
      <View style={[cS.pill, { backgroundColor: cat.bg }]}>
        <Text style={[cS.pillText, { color: cat.ink }]}>{cat.label}</Text>
      </View>
      {onDelete ? (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onDelete(); }}
          style={cS.action}
          accessibilityLabel={`Supprimer ${activity.title}`}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="trash-outline" size={15} color={Colors.light.ink3} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.light.ink3} />
      )}
    </TouchableOpacity>
  );
}

const cS = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.light.surface, borderRadius: Radius.block,
    padding: Spacing.base, ...Shadow.sm,
  },
  icon:     { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content:  { flex: 1 },
  title:    { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink, letterSpacing: -0.2 },
  sub:      { fontSize: FontSize.sm, color: Colors.light.ink3, marginTop: 2 },
  pill:     { borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  pillText: { fontSize: FontSize.xs, fontWeight: '700' },
  action:   { padding: 6 },
});

// ── Main Screen ───────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const { activities, addActivity, updateActivity, removeActivity } = useScheduleStore();
  const { setWork, setSport, setOtherActivity } = useUserStore();
  const insets = useSafeAreaInsets();

  // Migrate profile store → schedule store on first mount
  useEffect(() => {
    const acts = useScheduleStore.getState().activities;
    const w    = useUserStore.getState().work;
    const s    = useUserStore.getState().sport;
    const o    = useUserStore.getState().otherActivity;
    if (w.employed && w.startTime && w.endTime && !acts.find((a) => a.id === '__work__')) {
      useScheduleStore.getState().addActivity({ id: '__work__', title: w.role || 'Emploi', cat: 'travail', startTime: w.startTime!, endTime: w.endTime!, days: w.days ?? [], recurrence: 'weekly' });
    }
    if (s.active && s.startTime && s.endTime && !acts.find((a) => a.id === '__sport__')) {
      useScheduleStore.getState().addActivity({ id: '__sport__', title: s.activity || 'Sport & Activité', cat: 'activite', startTime: s.startTime!, endTime: s.endTime!, days: s.days ?? [], recurrence: 'weekly' });
    }
    if (o.active && o.startTime && o.endTime && !acts.find((a) => a.id === '__other__')) {
      useScheduleStore.getState().addActivity({ id: '__other__', title: o.title || 'Autre activité', cat: 'activite', startTime: o.startTime!, endTime: o.endTime!, days: o.days ?? [], recurrence: 'weekly' });
    }
  }, []);

  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [step,        setStep]        = useState<Step>(1);
  const [catKey,      setCatKey]      = useState<CatKey | null>(null);
  const [name,        setName]        = useState('');
  const [startTime,   setStartTime]   = useState('09:00');
  const [endTime,     setEndTime]     = useState('10:00');
  const [days,        setDays]        = useState<Set<WeekDay>>(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as WeekDay[]));
  const [recurrence,  setRecurrence]  = useState<Recurrence>('weekly');
  const slideAnim    = useSharedValue(SHEET_HEIGHT);
  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  // Open edit sheet when arriving from timeline tap
  useEffect(() => {
    if (!editId) return;
    router.setParams({ editId: undefined });
    const activity = activities.find((a) => a.id === editId);
    if (activity) openSheet(activity);
  }, [editId]);

  function openSheet(activity?: UserActivity) {
    if (activity) {
      setEditingId(activity.id);
      setCatKey(activity.cat);
      setName(activity.title);
      setStartTime(activity.startTime);
      setEndTime(activity.endTime);
      setDays(new Set(activity.days));
      setRecurrence(activity.recurrence);
      setStep(2); // Skip category step when editing
    } else {
      setEditingId(null);
      setCatKey(null); setName('');
      setStartTime('09:00'); setEndTime('10:00');
      setDays(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as WeekDay[]));
      setRecurrence('weekly');
      setStep(1);
    }
    slideAnim.value = SHEET_HEIGHT;
    setSheetOpen(true);
    slideAnim.value = withSpring(0, { damping: 22, mass: 0.9, stiffness: 200 });
  }

  function closeSheet() {
    slideAnim.value = withTiming(SHEET_HEIGHT, { duration: 200 }, () => {
      runOnJS(setSheetOpen)(false);
    });
  }

  function toggleDay(day: WeekDay) {
    setDays((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  }

  function handleSave() {
    const cat = CATEGORIES.find((c) => c.key === catKey) ?? CATEGORIES[1];
    const data = {
      title: name.trim() || cat.label,
      cat: catKey ?? 'activite',
      startTime,
      endTime,
      days: [...days] as WeekDay[],
      recurrence,
    };
    if (editingId) {
      updateActivity(editingId, data);
      if (editingId === '__work__')  setWork({ employed: true, role: data.title, days: data.days, startTime: data.startTime, endTime: data.endTime });
      if (editingId === '__sport__') setSport({ active: true, interested: false, activity: data.title, days: data.days, startTime: data.startTime, endTime: data.endTime });
      if (editingId === '__other__') setOtherActivity({ active: true, interested: false, title: data.title, days: data.days, startTime: data.startTime, endTime: data.endTime });
    } else {
      addActivity({ id: Date.now().toString(), ...data });
    }
    closeSheet();
  }

  const stepTitles: Record<Step, string> = {
    1: 'Catégorie',
    2: editingId ? 'Modifier l\'activité' : 'Détails',
    3: 'Planning',
  };
  const canNext = step === 1 ? catKey !== null : step === 2 ? true : days.size > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>Planning</Text>
          <Text style={s.title}>Mes activités</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => openSheet()}
          accessibilityLabel="Ajouter une activité"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color={Colors.light.onPrimary} />
          <Text style={s.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="calendar-outline" size={34} color={Colors.light.ink3} />
            </View>
            <Text style={s.emptyTitle}>Aucune activité</Text>
            <Text style={s.emptySub}>
              Ajoute tes activités récurrentes pour les voir apparaître dans ton planning.
            </Text>
          </View>
        ) : (
          <View style={s.list}>
            {activities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                onEdit={() => openSheet(act)}
                onDelete={() => {
                  removeActivity(act.id);
                  if (act.id === '__work__')  setWork({ employed: false, role: undefined, days: undefined, startTime: undefined, endTime: undefined });
                  if (act.id === '__sport__') setSport({ active: false, interested: false, activity: undefined, days: undefined, startTime: undefined, endTime: undefined });
                  if (act.id === '__other__') setOtherActivity({ active: false, interested: false, title: undefined, days: undefined, startTime: undefined, endTime: undefined });
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom sheet */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent
      >
        <View style={s.modalRoot}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={closeSheet}
            activeOpacity={1}
            accessibilityLabel="Fermer"
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View
              style={[s.sheet, { paddingBottom: insets.bottom + Spacing.lg }, sheetAnimStyle]}
            >
              {/* Handle */}
              <View style={s.handle} />

              {/* Header */}
              <View style={s.sheetHead}>
                <Text style={s.sheetTitle}>{stepTitles[step]}</Text>
                <TouchableOpacity onPress={closeSheet} style={s.closeBtn} accessibilityLabel="Fermer">
                  <Ionicons name="close" size={18} color={Colors.light.ink2} />
                </TouchableOpacity>
              </View>

              {/* Progress dots */}
              <View style={s.dots}>
                {([1, 2, 3] as Step[]).map((n) => (
                  <View key={n} style={[s.dot, n <= step && s.dotOn]} />
                ))}
              </View>

              {/* ── Step 1: Category ── */}
              {step === 1 && (
                <View style={s.body}>
                  {CATEGORIES.map((cat) => {
                    const on = catKey === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[s.catRow, on && s.catRowOn]}
                        onPress={() => setCatKey(cat.key)}
                        accessibilityLabel={cat.label}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                      >
                        <View style={[s.catIcon, { backgroundColor: on ? cat.bg : Colors.light.surfaceSunk }]}>
                          <Ionicons name={cat.icon} size={20} color={on ? cat.ink : Colors.light.ink3} />
                        </View>
                        <Text style={[s.catLabel, on && s.catLabelOn]}>{cat.label}</Text>
                        <View style={[s.radio, on && s.radioOn]}>
                          {on && <View style={s.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* ── Step 2: Details ── */}
              {step === 2 && (
                <View style={[s.body, { gap: Spacing.lg }]}>
                  <View style={s.fg}>
                    <Text style={s.fieldLabel}>Nom de l'activité</Text>
                    <TextInput
                      style={s.input}
                      value={name}
                      onChangeText={setName}
                      placeholder={CATEGORIES.find((c) => c.key === catKey)?.label ?? 'Mon activité'}
                      placeholderTextColor={Colors.light.ink3}
                      accessibilityLabel="Nom de l'activité"
                      returnKeyType="done"
                    />
                  </View>
                  <View style={s.fg}>
                    <Text style={s.fieldLabel}>Horaires</Text>
                    <View style={s.timeRow}>
                      <TimePickerRow label="Début" value={startTime} onChange={setStartTime} />
                      <View style={s.timeSep} />
                      <TimePickerRow label="Fin"   value={endTime}   onChange={setEndTime} />
                    </View>
                  </View>
                </View>
              )}

              {/* ── Step 3: Schedule ── */}
              {step === 3 && (
                <View style={[s.body, { gap: Spacing.lg }]}>
                  <View style={s.fg}>
                    <Text style={s.fieldLabel}>Jours</Text>
                    <View style={s.daysRow}>
                      {WEEK_DAYS.map((d) => {
                        const on = days.has(d.key);
                        return (
                          <TouchableOpacity
                            key={d.key}
                            style={[s.dayChip, on && s.dayChipOn]}
                            onPress={() => toggleDay(d.key)}
                            accessibilityLabel={d.key}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: on }}
                          >
                            <Text style={[s.dayText, on && s.dayTextOn]}>{d.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View style={s.fg}>
                    <Text style={s.fieldLabel}>Récurrence</Text>
                    <View style={{ gap: Spacing.sm }}>
                      {RECURRENCES.map((r) => {
                        const on = recurrence === r.key;
                        return (
                          <TouchableOpacity
                            key={r.key}
                            style={[s.recRow, on && s.recRowOn]}
                            onPress={() => setRecurrence(r.key)}
                            accessibilityLabel={r.label}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: on }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[s.recLabel, on && s.recLabelOn]}>{r.label}</Text>
                              <Text style={s.recSub}>{r.sub}</Text>
                            </View>
                            {on && <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* Footer */}
              <View style={s.footer}>
                {step !== 1 && (
                  <TouchableOpacity
                    style={s.prevBtn}
                    onPress={() => { if (step === 2) setStep(1); else setStep(2); }}
                    accessibilityLabel="Étape précédente"
                  >
                    <Ionicons name="chevron-back" size={18} color={Colors.light.primary} />
                    <Text style={s.prevText}>Retour</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[s.nextBtn, !canNext && s.nextOff]}
                  disabled={!canNext}
                  onPress={() => {
                    if (step === 1) setStep(2);
                    else if (step === 2) setStep(3);
                    else handleSave();
                  }}
                  accessibilityLabel={step === 3 ? 'Ajouter au planning' : 'Continuer'}
                >
                  <Text style={s.nextText}>{step === 3 ? 'Ajouter au planning' : 'Continuer'}</Text>
                  {step !== 3 && <Ionicons name="chevron-forward" size={16} color={Colors.light.onPrimary} />}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.sm,
  },
  eyebrow: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.light.primaryStrong, letterSpacing: 0.3 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.6, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.light.primary, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 10, ...Shadow.sm,
  },
  addBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.light.onPrimary },

  scroll: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  list: { gap: Spacing.md },

  empty: { alignItems: 'center', marginTop: 72, paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.light.ink },
  emptySub: { fontSize: FontSize.base, color: Colors.light.ink3, textAlign: 'center', lineHeight: 22 },

  // Modal / sheet
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: Spacing.sm, paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.light.hairline, alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.4 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.light.surfaceSunk, alignItems: 'center', justifyContent: 'center',
  },

  dots: { flexDirection: 'row', gap: 6, marginBottom: Spacing.lg },
  dot:  { height: 6, width: 6, borderRadius: 3, backgroundColor: Colors.light.hairline },
  dotOn: { backgroundColor: Colors.light.primary, width: 20 },

  body: { gap: Spacing.sm },
  fg:   { gap: Spacing.sm },

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  input: {
    backgroundColor: Colors.light.surfaceSunk, borderRadius: Radius.input,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.base,
    fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink,
  },
  timeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.surfaceSunk,
    borderRadius: Radius.block, padding: Spacing.md, gap: Spacing.md,
  },
  timeSep: { width: 1, height: 52, backgroundColor: Colors.light.hairline },

  // Category step
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.light.background, borderRadius: Radius.input,
    padding: Spacing.md, borderWidth: 1.5, borderColor: 'transparent',
  },
  catRowOn:    { borderColor: Colors.light.primary, backgroundColor: Colors.light.surface },
  catIcon:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catLabel:    { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },
  catLabelOn:  { color: Colors.light.primaryStrong },
  radio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.light.hairline, alignItems: 'center', justifyContent: 'center' },
  radioOn:  { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#fff' },

  // Days step
  daysRow: { flexDirection: 'row', gap: Spacing.sm },
  dayChip: {
    flex: 1, height: 40, borderRadius: 11,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  dayChipOn: { backgroundColor: Colors.light.primaryTint, borderColor: Colors.light.primary },
  dayText:   { fontSize: FontSize.xs, fontWeight: '700', color: Colors.light.ink3 },
  dayTextOn: { color: Colors.light.primaryStrong },

  // Recurrence step
  recRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.light.background, borderRadius: Radius.input,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  recRowOn:   { borderColor: Colors.light.primary, backgroundColor: Colors.light.primaryTint },
  recLabel:   { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },
  recLabelOn: { color: Colors.light.primaryStrong },
  recSub:     { fontSize: FontSize.xs, color: Colors.light.ink3, marginTop: 2 },

  // Footer
  footer: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.primaryTint, borderRadius: Radius.pill,
  },
  prevText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.primary },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill, paddingVertical: Spacing.base,
  },
  nextOff:  { opacity: 0.45 },
  nextText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },
});
