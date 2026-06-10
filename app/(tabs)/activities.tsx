import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TimeField } from '@/components/ui/TimeField';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useBehaviorStore } from '@/store/useBehaviorStore';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Icon } from '@/components/ui/Icon';
import { getTravelTime } from '@/lib/maps';
import { upsertActivity, deleteActivityRemote } from '@/lib/activitiesSync';
import { upsertCustomCat, deleteCustomCatRemote } from '@/lib/customCatsSync';
import { toLocalISODate } from '@/lib/recurrence';
import { genId } from '@/lib/id';
import { Colors, COLOR_PALETTE } from '@/constants/Colors';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { CatKey, UserActivity, WeekDay, Recurrence, ActivityLocation, CustomCategory } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type Step = 1 | 2 | 3;

// ── Data ──────────────────────────────────────────────────────────

const CATEGORIES: { key: CatKey; label: string; icon: IoniconsName; bg: string; ink: string }[] = [
  { key: 'travail',  label: 'Travail',   icon: 'briefcase-outline',  bg: Colors.light.workBg,     ink: Colors.light.workInk     },
  { key: 'sport',    label: 'Sport',     icon: 'barbell-outline',    bg: Colors.light.sportBg,    ink: Colors.light.sportInk    },
  { key: 'activite', label: 'Activité',  icon: 'star-outline',       bg: Colors.light.activityBg, ink: Colors.light.activityInk },
  { key: 'repas',    label: 'Repas',     icon: 'restaurant-outline', bg: Colors.light.mealBg,     ink: Colors.light.mealInk     },
  { key: 'trajet',   label: 'Trajet',    icon: 'car-outline',        bg: Colors.light.transitBg,  ink: Colors.light.transitInk  },
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

const N_WEEKLY_OPTS: { key: Recurrence; label: string }[] = [
  { key: 'biweekly',   label: '2 semaines' },
  { key: 'triweekly',  label: '3 semaines' },
  { key: 'quadweekly', label: '4 semaines' },
];
const N_WEEKLY_KEYS: Recurrence[] = ['biweekly', 'triweekly', 'quadweekly'];
const N_WEEKLY_LABEL: Partial<Record<Recurrence, string>> = {
  biweekly: '2', triweekly: '3', quadweekly: '4',
};

const SHEET_HEIGHT = 720;

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
  const C = useColors();
  const s = makeTpStyles(C);
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TimeField value={value} onChange={onChange} />
    </View>
  );
}

function makeTpStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap:  { alignItems: 'center', flex: 1 },
    label: { fontSize: FontSize.xs, fontWeight: '700', color: C.ink3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  });
}

// ── ActivityCard ──────────────────────────────────────────────────

type ActivityCardData = Pick<UserActivity, 'id' | 'title' | 'cat' | 'startTime' | 'endTime' | 'days' | 'color'>;

function ActivityCard({ activity, onEdit, onDelete }: {
  activity: ActivityCardData & { customCatId?: string };
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const C = useColors();
  const s = makeCardStyles(C);
  const customCategories = useScheduleStore((st) => st.customCategories);
  const customCat = activity.customCatId
    ? customCategories.find((c) => c.id === activity.customCatId)
    : undefined;
  const cat    = CATEGORIES.find((c) => c.key === activity.cat) ?? CATEGORIES[1];
  const bg     = activity.color?.bg  ?? customCat?.color.bg  ?? cat.bg;
  const ink    = activity.color?.ink ?? customCat?.color.ink ?? cat.ink;
  const label  = customCat?.label ?? cat.label;
  return (
    <TouchableOpacity
      style={s.wrap}
      onPress={onEdit}
      activeOpacity={0.75}
      accessibilityLabel={activity.title}
      accessibilityRole="button"
    >
      <View style={[s.icon, { backgroundColor: bg }]}>
        <Ionicons name={cat.icon} size={20} color={ink} />
      </View>
      <View style={s.content}>
        <Text style={s.title}>{activity.title}</Text>
        <Text style={s.sub}>{activity.startTime} – {activity.endTime} · {formatDays(activity.days)}</Text>
      </View>
      <View style={[s.pill, { backgroundColor: bg }]}>
        <Text style={[s.pillText, { color: ink }]}>{label}</Text>
      </View>
      {onDelete ? (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onDelete(); }}
          style={s.action}
          accessibilityLabel={`Supprimer ${activity.title}`}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="trash-outline" size={15} color={C.ink3} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={C.ink3} />
      )}
    </TouchableOpacity>
  );
}

function makeCardStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: C.surface, borderRadius: Radius.block,
      padding: Spacing.base, ...Shadow.sm,
    },
    icon:     { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    content:  { flex: 1 },
    title:    { fontSize: FontSize.base, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
    sub:      { fontSize: FontSize.sm, color: C.ink3, marginTop: 2 },
    pill:     { borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
    pillText: { fontSize: FontSize.xs, fontWeight: '700' },
    action:   { padding: 6 },
  });
}

// ── Main Screen ───────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const { activities, addActivity, updateActivity, removeActivity,
          customCategories, addCustomCategory, removeCustomCategory } = useScheduleStore();
  const clearReport = useBehaviorStore((s) => s.clearReport);
  const { setWork, setSport, setOtherActivity, profile } = useUserStore();
  const userId = useAuthStore((st) => st.session?.user?.id);
  const insets = useSafeAreaInsets();

  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [step,        setStep]        = useState<Step>(1);
  const [catKey,      setCatKey]      = useState<CatKey | null>(null);
  const [customCatId, setCustomCatId] = useState<string | null>(null);

  // Create-category inline form state
  const [showCreateCat,  setShowCreateCat]  = useState(false);
  const [newCatLabel,    setNewCatLabel]    = useState('');
  const [newCatColor,    setNewCatColor]    = useState<{ bg: string; ink: string }>(COLOR_PALETTE[0]);
  const [name,        setName]        = useState('');
  const [startTime,   setStartTime]   = useState('09:00');
  const [endTime,     setEndTime]     = useState('10:00');
  const [days,        setDays]        = useState<Set<WeekDay>>(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as WeekDay[]));
  const [recurrence,  setRecurrence]  = useState<Recurrence>('weekly');
  const [color,          setColor]          = useState<{ bg: string; ink: string } | undefined>(undefined);
  const [notifyWeekEnd,  setNotifyWeekEnd]  = useState(false);
  const [location,       setLocation]       = useState<ActivityLocation | undefined>(undefined);
  const [useHomeAsStart, setUseHomeAsStart] = useState(true);
  const [departure,      setDeparture]      = useState<ActivityLocation | undefined>(undefined);
  const [trajetMinutes,  setTrajetMinutes]  = useState<number | undefined>(undefined);
  const [trajetLoading,  setTrajetLoading]  = useState(false);
  const [trajetError,    setTrajetError]    = useState(false);
  const slideAnim    = useSharedValue(SHEET_HEIGHT);
  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  const { height: windowH } = useWindowDimensions();
  const [keyboardH, setKeyboardH] = useState(0);
  const sheetHeight = Math.min(SHEET_HEIGHT, windowH - insets.top - keyboardH - 20);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e) => setKeyboardH(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardH(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Open edit sheet when arriving from timeline tap
  useEffect(() => {
    if (!editId) return;
    router.setParams({ editId: undefined });
    const activity = activities.find((a) => a.id === editId);
    if (activity) openSheet(activity);
  }, [editId]);

  function openSheet(activity?: UserActivity) {
    setShowCreateCat(false);
    setNewCatLabel('');
    setNewCatColor(COLOR_PALETTE[0]);
    if (activity) {
      setEditingId(activity.id);
      setCatKey(activity.cat);
      setCustomCatId(activity.customCatId ?? null);
      setName(activity.title);
      setStartTime(activity.startTime);
      setEndTime(activity.endTime);
      setDays(new Set(activity.days));
      setRecurrence(activity.recurrence);
      setColor(activity.color);
      setNotifyWeekEnd(activity.notifyWeekEnd ?? false);
      setLocation(activity.location);
      setUseHomeAsStart(!activity.departureLocation);
      setDeparture(activity.departureLocation);
      setTrajetMinutes(activity.trajetMinutesBefore);
      setTrajetLoading(false);
      setTrajetError(false);
      setStep(2); // Skip category step when editing
    } else {
      setEditingId(null);
      setCatKey(null); setCustomCatId(null); setName('');
      setStartTime('09:00'); setEndTime('10:00');
      setDays(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as WeekDay[]));
      setRecurrence('weekly');
      setColor(undefined);
      setNotifyWeekEnd(false);
      setLocation(undefined);
      setUseHomeAsStart(true);
      setDeparture(undefined);
      setTrajetMinutes(undefined);
      setTrajetLoading(false);
      setTrajetError(false);
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
    const customCat = customCatId ? customCategories.find((c) => c.id === customCatId) : undefined;
    const builtinCat = CATEGORIES.find((c) => c.key === catKey) ?? CATEGORIES[1];
    // Keep the original anchor when editing; new (or legacy) activities anchor to today
    const existingAnchor = editingId
      ? activities.find((a) => a.id === editingId)?.anchorDate
      : undefined;
    const data = {
      title: name.trim() || customCat?.label || builtinCat.label,
      cat: catKey ?? 'activite' as CatKey,
      customCatId: customCatId ?? undefined,
      startTime,
      endTime,
      days: [...days] as WeekDay[],
      recurrence,
      anchorDate: existingAnchor ?? toLocalISODate(new Date()),
      color,
      notifyWeekEnd: recurrence === 'none' ? notifyWeekEnd : undefined,
      location,
      departureLocation: useHomeAsStart ? undefined : departure,
      trajetMinutesBefore: trajetMinutes,
    };
    clearReport(); // schedule changed → cached weekly report is stale
    if (editingId) {
      updateActivity(editingId, data);
      if (editingId === '__work__')  setWork({ employed: true, role: data.title, days: data.days, startTime: data.startTime, endTime: data.endTime });
      if (editingId === '__sport__') setSport({ active: true, interested: false, activity: data.title, days: data.days, startTime: data.startTime, endTime: data.endTime });
      if (editingId === '__other__') setOtherActivity({ active: true, interested: false, title: data.title, days: data.days, startTime: data.startTime, endTime: data.endTime });
      if (userId) upsertActivity(userId, { id: editingId, ...data } as any);
    } else {
      const newActivity = { id: genId(), ...data };
      addActivity(newActivity as any);
      if (userId) upsertActivity(userId, newActivity as any);
    }
    closeSheet();
  }

  async function computeTrajet(origin: ActivityLocation | undefined, dest: ActivityLocation | undefined) {
    setTrajetMinutes(undefined);
    setTrajetError(false);
    if (!dest || (dest.lat === 0 && dest.lng === 0)) return;
    const from = origin ?? profile.homeLocation;
    if (!from || (from.lat === 0 && from.lng === 0)) return;
    setTrajetLoading(true);
    const result = await getTravelTime(from, dest);
    setTrajetLoading(false);
    if (result) setTrajetMinutes(result.durationMinutes);
    else setTrajetError(true);
  }

  async function handleLocationChange(loc: ActivityLocation | undefined) {
    setLocation(loc);
    await computeTrajet(useHomeAsStart ? undefined : departure, loc);
  }

  async function handleDepartureChange(loc: ActivityLocation | undefined) {
    setDeparture(loc);
    await computeTrajet(loc, location);
  }

  async function handleToggleDeparture(toHome: boolean) {
    setUseHomeAsStart(toHome);
    if (toHome) setDeparture(undefined);
    await computeTrajet(toHome ? undefined : departure, location);
  }

  const stepTitles: Record<Step, string> = {
    1: 'Catégorie',
    2: editingId ? 'Modifier l\'activité' : 'Détails',
    3: 'Planning',
  };
  const canNext = step === 1 ? (catKey !== null || customCatId !== null) : step === 2 ? true : days.size > 0;

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
          <Ionicons name="add" size={18} color={C.onPrimary} />
          <Text style={s.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Weekly report banner */}
      <TouchableOpacity
        style={s.bilanBanner}
        onPress={() => router.push('/weekly-report' as any)}
        accessibilityLabel="Voir le bilan de la semaine"
        accessibilityRole="button"
      >
        <View style={s.bilanLeft}>
          <Icon name="calendar" size={18} stroke={C.primary} sw={2} />
          <Text style={s.bilanText}>Bilan de la semaine</Text>
        </View>
        <Icon name="chevright" size={16} stroke={C.ink3} sw={1.8} />
      </TouchableOpacity>

      {/* List */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="calendar-outline" size={34} color={C.ink3} />
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
                  clearReport();
                  if (act.id === '__work__')  setWork({ employed: false, role: undefined, days: undefined, startTime: undefined, endTime: undefined });
                  if (act.id === '__sport__') setSport({ active: false, interested: false, activity: undefined, days: undefined, startTime: undefined, endTime: undefined });
                  if (act.id === '__other__') setOtherActivity({ active: false, interested: false, title: undefined, days: undefined, startTime: undefined, endTime: undefined });
                  if (userId) deleteActivityRemote(userId, act.id);
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
            style={StyleSheet.absoluteFillObject}
            onPress={closeSheet}
            activeOpacity={1}
            accessibilityLabel="Fermer"
          />
          <Animated.View
            style={[s.sheet, { position: 'absolute', left: 0, right: 0, bottom: keyboardH, height: sheetHeight, paddingBottom: insets.bottom + Spacing.lg }, sheetAnimStyle]}
          >
              {/* Handle */}
              <View style={s.handle} />

              {/* Header */}
              <View style={s.sheetHead}>
                <Text style={s.sheetTitle}>{stepTitles[step]}</Text>
                <TouchableOpacity onPress={closeSheet} style={s.closeBtn} accessibilityLabel="Fermer">
                  <Ionicons name="close" size={18} color={C.ink2} />
                </TouchableOpacity>
              </View>

              {/* Progress dots */}
              <View style={s.dots}>
                {([1, 2, 3] as Step[]).map((n) => (
                  <View key={n} style={[s.dot, n <= step && s.dotOn]} />
                ))}
              </View>

              <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* ── Step 1: Category ── */}
              {step === 1 && (
                <View style={s.body}>
                  {/* Built-in categories */}
                  {CATEGORIES.map((cat) => {
                    const on = catKey === cat.key && !customCatId;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[s.catRow, on && s.catRowOn]}
                        onPress={() => { setCatKey(cat.key); setCustomCatId(null); }}
                        accessibilityLabel={cat.label}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                      >
                        <View style={[s.catIcon, { backgroundColor: on ? cat.bg : C.surfaceSunk }]}>
                          <Ionicons name={cat.icon} size={20} color={on ? cat.ink : C.ink3} />
                        </View>
                        <Text style={[s.catLabel, on && s.catLabelOn]}>{cat.label}</Text>
                        <View style={[s.radio, on && s.radioOn]}>
                          {on && <View style={s.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Custom categories */}
                  {customCategories.length > 0 && (
                    <>
                      <View style={s.catSeparator}>
                        <View style={s.catSepLine} />
                        <Text style={s.catSepLabel}>Mes catégories</Text>
                        <View style={s.catSepLine} />
                      </View>
                      {customCategories.map((cc) => {
                        const on = customCatId === cc.id;
                        return (
                          <TouchableOpacity
                            key={cc.id}
                            style={[s.catRow, on && s.catRowOn]}
                            onPress={() => { setCustomCatId(cc.id); setCatKey('activite'); }}
                            accessibilityLabel={cc.label}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: on }}
                          >
                            <View style={[s.catIcon, { backgroundColor: on ? cc.color.bg : C.surfaceSunk }]}>
                              <View style={[s.colorDot, { backgroundColor: on ? cc.color.ink : C.ink3 }]} />
                            </View>
                            <Text style={[s.catLabel, on && s.catLabelOn]}>{cc.label}</Text>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                removeCustomCategory(cc.id);
                                if (userId) deleteCustomCatRemote(userId, cc.id);
                                if (customCatId === cc.id) setCustomCatId(null);
                              }}
                              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                              accessibilityLabel={`Supprimer ${cc.label}`}
                            >
                              <Ionicons name="trash-outline" size={15} color={C.ink3} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}

                  {/* Create custom category */}
                  {!showCreateCat ? (
                    <TouchableOpacity
                      style={s.createCatBtn}
                      onPress={() => setShowCreateCat(true)}
                      accessibilityLabel="Créer une catégorie"
                    >
                      <Ionicons name="add-circle-outline" size={18} color={C.primary} />
                      <Text style={s.createCatBtnText}>Créer une catégorie</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={s.createCatForm}>
                      <Text style={s.fieldLabel}>Nom</Text>
                      <TextInput
                        style={s.input}
                        value={newCatLabel}
                        onChangeText={setNewCatLabel}
                        placeholder="Ex : Bien-être, Famille…"
                        placeholderTextColor={C.ink3}
                        returnKeyType="done"
                        autoFocus
                        accessibilityLabel="Nom de la catégorie"
                      />
                      <Text style={[s.fieldLabel, { marginTop: Spacing.sm }]}>Couleur</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.colorRow}>
                        {COLOR_PALETTE.map((p, i) => {
                          const on = newCatColor.bg === p.bg;
                          return (
                            <TouchableOpacity
                              key={i}
                              style={[s.swatch, { backgroundColor: p.bg }, on && s.swatchSelected]}
                              onPress={() => setNewCatColor({ bg: p.bg, ink: p.ink })}
                              accessibilityLabel={p.label}
                            >
                              {on && <Ionicons name="checkmark" size={14} color={p.ink} />}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <View style={s.createCatActions}>
                        <TouchableOpacity
                          style={s.createCatCancel}
                          onPress={() => { setShowCreateCat(false); setNewCatLabel(''); }}
                          accessibilityLabel="Annuler"
                        >
                          <Text style={s.createCatCancelText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.createCatSave, !newCatLabel.trim() && s.createCatSaveDisabled]}
                          onPress={() => {
                            if (!newCatLabel.trim()) return;
                            const newCat: CustomCategory = {
                              id:    `custom_${genId()}`,
                              label: newCatLabel.trim(),
                              color: newCatColor,
                            };
                            addCustomCategory(newCat);
                            if (userId) upsertCustomCat(userId, newCat);
                            setCustomCatId(newCat.id);
                            setCatKey('activite');
                            setShowCreateCat(false);
                            setNewCatLabel('');
                            setNewCatColor(COLOR_PALETTE[0]);
                          }}
                          disabled={!newCatLabel.trim()}
                          accessibilityLabel="Créer la catégorie"
                        >
                          <Text style={s.createCatSaveText}>Créer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
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
                      placeholderTextColor={C.ink3}
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
                  <View style={s.fg}>
                    <Text style={s.fieldLabel}>Couleur</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.colorRow}>
                      {/* Default = category color */}
                      <TouchableOpacity
                        style={[s.swatch, s.swatchDefault, !color && s.swatchSelected]}
                        onPress={() => setColor(undefined)}
                        accessibilityLabel="Couleur par défaut"
                      >
                        <Ionicons name="color-palette-outline" size={15} color={C.ink3} />
                      </TouchableOpacity>
                      {COLOR_PALETTE.map((c, i) => {
                        const on = color?.bg === c.bg;
                        return (
                          <TouchableOpacity
                            key={i}
                            style={[s.swatch, { backgroundColor: c.bg }, on && s.swatchSelected]}
                            onPress={() => setColor({ bg: c.bg, ink: c.ink })}
                            accessibilityLabel={c.label}
                          >
                            {on && <Ionicons name="checkmark" size={14} color={c.ink} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {(catKey === 'travail' || catKey === 'sport' || catKey === 'activite') && (
                    <View style={s.fg}>
                      <Text style={s.fieldLabel}>Lieu (optionnel)</Text>
                      <LocationPicker value={location} onChange={handleLocationChange} />

                      {location && (
                        <View style={s.fg}>
                          <Text style={s.fieldLabel}>Départ depuis</Text>
                          <View style={s.depToggleRow}>
                            {(['home', 'other'] as const).map((opt) => {
                              const on = opt === 'home' ? useHomeAsStart : !useHomeAsStart;
                              return (
                                <TouchableOpacity
                                  key={opt}
                                  style={[s.depToggleBtn, on && s.depToggleBtnOn]}
                                  onPress={() => handleToggleDeparture(opt === 'home')}
                                  accessibilityRole="radio"
                                  accessibilityState={{ selected: on }}
                                  accessibilityLabel={opt === 'home' ? 'Domicile' : 'Autre lieu'}
                                >
                                  <Ionicons
                                    name={opt === 'home' ? 'home-outline' : 'location-outline'}
                                    size={13}
                                    color={on ? C.primaryStrong : C.ink3}
                                  />
                                  <Text style={[s.depToggleText, on && s.depToggleTextOn]}>
                                    {opt === 'home' ? 'Domicile' : 'Autre lieu'}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          {!useHomeAsStart && (
                            <LocationPicker
                              value={departure}
                              onChange={handleDepartureChange}
                              placeholder="Adresse de départ…"
                            />
                          )}
                        </View>
                      )}

                      {trajetLoading && (
                        <View style={s.trajetChip}>
                          <ActivityIndicator size="small" color={C.transitInk} />
                          <Text style={s.trajetText}>Calcul du trajet…</Text>
                        </View>
                      )}
                      {!trajetLoading && trajetMinutes !== undefined && (
                        <View style={s.trajetChip}>
                          <Ionicons name="car-outline" size={13} color={C.transitInk} />
                          <Text style={s.trajetText}>
                            {trajetMinutes} min depuis {useHomeAsStart
                              ? 'ton domicile'
                              : (departure?.address ?? 'ton lieu de départ')}
                          </Text>
                        </View>
                      )}
                      {!trajetLoading && trajetError && (
                        <Text style={s.trajetHint}>Temps de trajet non disponible — le trajet ne sera pas ajouté automatiquement.</Text>
                      )}
                      {!trajetLoading && !trajetError && location && trajetMinutes === undefined && (
                        <Text style={s.trajetHint}>
                          {useHomeAsStart && (!profile.homeLocation || (profile.homeLocation.lat === 0 && profile.homeLocation.lng === 0))
                            ? 'Ajoute une adresse domicile géolocalisée dans Mon compte pour calculer le trajet.'
                            : !useHomeAsStart && (!departure || (departure.lat === 0 && departure.lng === 0))
                            ? 'Sélectionne une adresse de départ dans la liste pour calculer le trajet.'
                            : location.lat === 0 && location.lng === 0
                            ? 'Adresse de destination saisie manuellement — temps de trajet non calculable.'
                            : null}
                        </Text>
                      )}
                    </View>
                  )}
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
                      {/* Chaque semaine */}
                      <TouchableOpacity
                        style={[s.recRow, recurrence === 'weekly' && s.recRowOn]}
                        onPress={() => setRecurrence('weekly')}
                        accessibilityLabel="Chaque semaine"
                        accessibilityRole="radio"
                        accessibilityState={{ selected: recurrence === 'weekly' }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[s.recLabel, recurrence === 'weekly' && s.recLabelOn]}>Chaque semaine</Text>
                          <Text style={s.recSub}>Se répète toutes les semaines</Text>
                        </View>
                        {recurrence === 'weekly' && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
                      </TouchableOpacity>

                      {/* Toutes les N semaines — bouton combiné */}
                      <View style={{ gap: Spacing.sm }}>
                        <TouchableOpacity
                          style={[s.recRow, N_WEEKLY_KEYS.includes(recurrence) && s.recRowOn]}
                          onPress={() => { if (!N_WEEKLY_KEYS.includes(recurrence)) setRecurrence('biweekly'); }}
                          accessibilityLabel="Toutes les N semaines"
                          accessibilityRole="radio"
                          accessibilityState={{ selected: N_WEEKLY_KEYS.includes(recurrence) }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[s.recLabel, N_WEEKLY_KEYS.includes(recurrence) && s.recLabelOn]}>
                              {N_WEEKLY_KEYS.includes(recurrence)
                                ? `Toutes les ${N_WEEKLY_LABEL[recurrence]} semaines`
                                : 'Toutes les N semaines'}
                            </Text>
                            <Text style={s.recSub}>Choisir l'intervalle ci-dessous</Text>
                          </View>
                          {N_WEEKLY_KEYS.includes(recurrence) && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
                        </TouchableOpacity>
                        {N_WEEKLY_KEYS.includes(recurrence) && (
                          <View style={s.nWeekRow}>
                            {N_WEEKLY_OPTS.map((opt) => {
                              const active = recurrence === opt.key;
                              return (
                                <TouchableOpacity
                                  key={opt.key}
                                  style={[s.nWeekChip, active && s.nWeekChipOn]}
                                  onPress={() => setRecurrence(opt.key)}
                                  accessibilityLabel={opt.label}
                                  accessibilityRole="radio"
                                  accessibilityState={{ selected: active }}
                                >
                                  <Text style={[s.nWeekText, active && s.nWeekTextOn]}>{opt.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      {/* Ponctuel */}
                      <TouchableOpacity
                        style={[s.recRow, recurrence === 'none' && s.recRowOn]}
                        onPress={() => setRecurrence('none')}
                        accessibilityLabel="Ponctuel"
                        accessibilityRole="radio"
                        accessibilityState={{ selected: recurrence === 'none' }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[s.recLabel, recurrence === 'none' && s.recLabelOn]}>Ponctuel</Text>
                          <Text style={s.recSub}>Ne se répète pas</Text>
                        </View>
                        {recurrence === 'none' && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
                      </TouchableOpacity>
                    </View>
                  </View>
                  {recurrence === 'none' && (
                    <TouchableOpacity
                      style={s.notifyRow}
                      onPress={() => setNotifyWeekEnd((v) => !v)}
                      activeOpacity={0.8}
                      accessibilityLabel="Rappel fin de semaine"
                      accessibilityRole="switch"
                      accessibilityState={{ checked: notifyWeekEnd }}
                    >
                      <View style={s.notifyIcon}>
                        <Ionicons name="notifications-outline" size={18} color={C.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.notifyLabel}>Rappel dimanche soir</Text>
                        <Text style={s.notifySub}>Notification pour reconfigurer la semaine suivante</Text>
                      </View>
                      <Switch
                        value={notifyWeekEnd}
                        onValueChange={setNotifyWeekEnd}
                        trackColor={{ false: C.hairline, true: C.primaryTint2 }}
                        thumbColor={notifyWeekEnd ? C.primary : C.surface}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              </ScrollView>

              {/* Footer */}
              <View style={s.footer}>
                {step !== 1 && (
                  <TouchableOpacity
                    style={s.prevBtn}
                    onPress={() => { if (step === 2) setStep(1); else setStep(2); }}
                    accessibilityLabel="Étape précédente"
                  >
                    <Ionicons name="chevron-back" size={18} color={C.primary} />
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
                  {step !== 3 && <Ionicons name="chevron-forward" size={16} color={C.onPrimary} />}
                </TouchableOpacity>
              </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    header: {
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.sm,
    },
    eyebrow: { fontSize: FontSize.sm, fontWeight: '600', color: C.primaryStrong, letterSpacing: 0.3 },
    title: { fontSize: 30, fontWeight: '800', color: C.ink, letterSpacing: -0.6, marginTop: 2 },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: C.primary, borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md, paddingVertical: 10, ...Shadow.sm,
    },
    addBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: C.onPrimary },

    bilanBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
      backgroundColor: C.primaryTint,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    },
    bilanLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    bilanText: { fontSize: FontSize.sm, fontWeight: '700', color: C.primaryStrong },

    // Custom category creation
    catSeparator: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
    catSepLine:   { flex: 1, height: 1, backgroundColor: C.hairline },
    catSepLabel:  { fontSize: FontSize.xs, fontWeight: '700', color: C.ink3, textTransform: 'uppercase', letterSpacing: 0.5 },
    colorDot:     { width: 10, height: 10, borderRadius: 5 },
    createCatBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingVertical: Spacing.md, justifyContent: 'center',
    },
    createCatBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: C.primary },
    createCatForm:    { gap: Spacing.xs, marginTop: Spacing.sm, backgroundColor: C.surfaceSunk, borderRadius: Radius.block, padding: Spacing.md },
    createCatActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    createCatCancel:  { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.input, backgroundColor: C.surface },
    createCatCancelText: { fontSize: FontSize.sm, fontWeight: '600', color: C.ink2 },
    createCatSave:       { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.input, backgroundColor: C.primary },
    createCatSaveDisabled: { opacity: 0.4 },
    createCatSaveText:   { fontSize: FontSize.sm, fontWeight: '700', color: C.onPrimary },

    scroll: { flex: 1 },
    listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
    list: { gap: Spacing.md },

    empty: { alignItems: 'center', marginTop: 72, paddingHorizontal: Spacing.xl, gap: Spacing.md },
    emptyIcon: {
      width: 72, height: 72, borderRadius: 22,
      backgroundColor: C.surfaceSunk,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: C.ink },
    emptySub: { fontSize: FontSize.base, color: C.ink3, textAlign: 'center', lineHeight: 22 },

    // Modal / sheet
    modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingTop: Spacing.sm, paddingHorizontal: Spacing.lg,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: C.hairline, alignSelf: 'center', marginBottom: Spacing.md,
    },
    sheetHead: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    sheetTitle: { fontSize: FontSize.xl, fontWeight: '800', color: C.ink, letterSpacing: -0.4 },
    closeBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: C.surfaceSunk, alignItems: 'center', justifyContent: 'center',
    },

    dots: { flexDirection: 'row', gap: 6, marginBottom: Spacing.lg },
    dot:  { height: 6, width: 6, borderRadius: 3, backgroundColor: C.hairline },
    dotOn: { backgroundColor: C.primary, width: 20 },

    body: { gap: Spacing.sm },
    fg:   { gap: Spacing.sm },

    fieldLabel: {
      fontSize: 11, fontWeight: '700', color: C.ink3,
      textTransform: 'uppercase', letterSpacing: 0.6,
    },
    input: {
      backgroundColor: C.surfaceSunk, borderRadius: Radius.input,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.base,
      fontSize: FontSize.base, fontWeight: '600', color: C.ink,
    },
    timeRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.block, padding: Spacing.md, gap: Spacing.md,
    },
    timeSep: { width: 1, height: 52, backgroundColor: C.hairline },

    // Category step
    catRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: C.background, borderRadius: Radius.input,
      padding: Spacing.md, borderWidth: 1.5, borderColor: 'transparent',
    },
    catRowOn:    { borderColor: C.primary, backgroundColor: C.surface },
    catIcon:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    catLabel:    { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: C.ink },
    catLabelOn:  { color: C.primaryStrong },
    radio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.hairline, alignItems: 'center', justifyContent: 'center' },
    radioOn:  { borderColor: C.primary, backgroundColor: C.primary },
    radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#fff' },

    // Days step
    daysRow: { flexDirection: 'row', gap: Spacing.sm },
    dayChip: {
      flex: 1, height: 40, borderRadius: 11,
      backgroundColor: C.surfaceSunk,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: 'transparent',
    },
    dayChipOn: { backgroundColor: C.primaryTint, borderColor: C.primary },
    dayText:   { fontSize: FontSize.xs, fontWeight: '700', color: C.ink3 },
    dayTextOn: { color: C.primaryStrong },

    // Recurrence step
    recRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: C.background, borderRadius: Radius.input,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      borderWidth: 1.5, borderColor: 'transparent',
    },
    recRowOn:   { borderColor: C.primary, backgroundColor: C.primaryTint },
    recLabel:   { fontSize: FontSize.base, fontWeight: '600', color: C.ink },
    recLabelOn: { color: C.primaryStrong },
    recSub:     { fontSize: FontSize.xs, color: C.ink3, marginTop: 2 },

    // N-weekly sub-chips
    nWeekRow:    { flexDirection: 'row', gap: Spacing.sm },
    nWeekChip: {
      flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.input,
      backgroundColor: C.surfaceSunk,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: 'transparent',
    },
    nWeekChipOn: { backgroundColor: C.primaryTint, borderColor: C.primary },
    nWeekText:   { fontSize: FontSize.sm, fontWeight: '600', color: C.ink3 },
    nWeekTextOn: { color: C.primaryStrong },

    // Notify week-end toggle
    notifyRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: C.primaryTint,
      borderRadius: Radius.input, padding: Spacing.md,
    },
    notifyIcon: {
      width: 36, height: 36, borderRadius: 11,
      backgroundColor: C.primaryTint2,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    notifyLabel: { fontSize: FontSize.base, fontWeight: '700', color: C.primaryStrong },
    notifySub:   { fontSize: FontSize.xs,   fontWeight: '500', color: C.primary, marginTop: 2 },

    // Departure toggle
    depToggleRow: { flexDirection: 'row', gap: Spacing.sm },
    depToggleBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.xs, paddingVertical: Spacing.sm,
      backgroundColor: C.surface, borderRadius: Radius.input,
      borderWidth: 1.5, borderColor: C.hairline, ...Shadow.sm,
    },
    depToggleBtnOn:  { backgroundColor: C.primaryTint, borderColor: C.primary },
    depToggleText:   { fontSize: FontSize.sm, fontWeight: '600', color: C.ink2 } as const,
    depToggleTextOn: { color: C.primaryStrong, fontWeight: '700' } as const,

    // Trajet chip
    trajetChip: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      backgroundColor: C.transitBg, borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md, paddingVertical: 6, alignSelf: 'flex-start',
    },
    trajetText: { fontSize: FontSize.xs, fontWeight: '600', color: C.transitInk },
    trajetHint: { fontSize: FontSize.xs, color: C.ink3, fontStyle: 'italic', marginTop: 2 },

    // Color picker
    colorRow:      { flexDirection: 'row', gap: 10, paddingVertical: 4 },
    swatch: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: 'transparent',
    },
    swatchDefault: { backgroundColor: C.surfaceSunk },
    swatchSelected: { borderColor: C.ink2 },

    // Footer
    footer: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
    prevBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingVertical: Spacing.base, paddingHorizontal: Spacing.md,
      backgroundColor: C.primaryTint, borderRadius: Radius.pill,
    },
    prevText: { fontSize: FontSize.base, fontWeight: '700', color: C.primary },
    nextBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: C.primary,
      borderRadius: Radius.pill, paddingVertical: Spacing.base,
    },
    nextOff:  { opacity: 0.45 },
    nextText: { fontSize: FontSize.base, fontWeight: '700', color: C.onPrimary },
  });
}
