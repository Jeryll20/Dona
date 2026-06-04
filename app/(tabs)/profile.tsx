import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useColors } from '@/hooks/useColors';
import type { ThemePreference } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const GOAL_LABELS: Record<string, string> = {
  organise: 'Me sentir mieux organisé·e',
  activite: 'Ajouter une activité',
  routine:  'Créer une routine durable',
};

interface RowProps {
  icon: IoniconsName;
  iconBg: string;
  iconInk: string;
  label: string;
  value?: string;
  onPress?: () => void;
}

function SettingsRow({ icon, iconBg, iconInk, label, value, onPress }: RowProps) {
  const C = useColors();
  const s = makeRowStyles(C);
  return (
    <TouchableOpacity
      style={s.wrap}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityLabel={label}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <View style={[s.icon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconInk} />
      </View>
      <View style={s.content}>
        <Text style={s.label}>{label}</Text>
        {value ? <Text style={s.value}>{value}</Text> : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={C.ink3} />}
    </TouchableOpacity>
  );
}

function makeRowStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: C.surface, borderRadius: Radius.block,
      padding: Spacing.base, ...Shadow.sm,
    },
    icon:    { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    content: { flex: 1 },
    label:   { fontSize: FontSize.base, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
    value:   { fontSize: FontSize.sm, color: C.ink3, marginTop: 2 },
  });
}

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: IoniconsName }[] = [
  { key: 'system', label: 'Auto',   icon: 'phone-portrait-outline' },
  { key: 'light',  label: 'Clair',  icon: 'sunny-outline'          },
  { key: 'dark',   label: 'Sombre', icon: 'moon-outline'           },
];

function ThemeRow() {
  const C = useColors();
  const s = makeThemeStyles(C);
  const themePreference = useUserStore((st) => st.themePreference ?? 'system');
  const setTheme        = useUserStore((st) => st.setTheme);
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Ionicons name="color-palette-outline" size={18} color={C.primaryStrong} />
      </View>
      <Text style={s.label}>Apparence</Text>
      <View style={s.chips}>
        {THEME_OPTIONS.map((opt) => {
          const on = themePreference === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[s.chip, on && s.chipOn]}
              onPress={() => setTheme(opt.key)}
              accessibilityLabel={opt.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <Ionicons name={opt.icon} size={13} color={on ? C.primaryStrong : C.ink3} />
              <Text style={[s.chipText, on && s.chipTextOn]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function makeThemeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: C.surface, borderRadius: Radius.block, padding: Spacing.base, ...Shadow.sm },
    iconWrap:   { width: 42, height: 42, borderRadius: 13, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    label:      { fontSize: FontSize.base, fontWeight: '700', color: C.ink, flex: 1 },
    chips:      { flexDirection: 'row', gap: 6 },
    chip:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.pill, backgroundColor: C.surfaceSunk, borderWidth: 1.5, borderColor: 'transparent' },
    chipOn:     { backgroundColor: C.primaryTint, borderColor: C.primary },
    chipText:   { fontSize: 11, fontWeight: '600', color: C.ink3 },
    chipTextOn: { color: C.primaryStrong, fontWeight: '700' },
  });
}

export default function ProfileScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const { profile, sleep, meals, cycle } = useUserStore();
  const signOut = useAuthStore((st) => st.signOut);

  const firstName = profile.firstName ?? '';
  const lastName  = profile.lastName  ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || null;
  const avatarLetter = (firstName || 'D')[0].toUpperCase();

  const goalKey = profile.goal ?? null;
  const goalLabel = goalKey ? GOAL_LABELS[goalKey] : null;

  const sleepValue = sleep.bedtime && sleep.waketime
    ? `${sleep.bedtime} → ${sleep.waketime}`
    : undefined;

  const mealEntries = meals.entries ?? meals.times?.map((t) => ({ time: t, label: t })) ?? [];
  const mealsValue = mealEntries.length
    ? `${mealEntries.length} repas · ${mealEntries.map((e) => e.time ?? e).join(', ')}`
    : undefined;

  const cycleValue = cycle.tracking
    ? `Cycle ${cycle.cycleDays ?? 28} jours`
    : 'Non activé';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <TouchableOpacity
          style={s.avatarSection}
          onPress={() => router.push('/profile/account')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Modifier mon compte"
        >
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{avatarLetter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.screenTitle}>
              {fullName ?? 'Mon profil'}
            </Text>
            {!fullName && (
              <Text style={s.editHint}>Appuie pour renseigner ton profil</Text>
            )}
            {goalLabel && (
              <View style={s.goalBadge}>
                <Ionicons name="flag-outline" size={12} color={C.primaryStrong} />
                <Text style={s.goalText}>{goalLabel}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.ink3} />
        </TouchableOpacity>

        {/* Stats */}
        <Text style={s.sectionLabel}>Aperçu</Text>
        <View style={s.group}>
          <SettingsRow
            icon="bar-chart-outline"
            iconBg={C.primaryTint}
            iconInk={C.primary}
            label="Statistiques & suivi"
            value="Sommeil, activités, répartition"
            onPress={() => router.push('/profile/stats')}
          />
        </View>

        {/* Settings */}
        <Text style={[s.sectionLabel, { marginTop: Spacing.xl }]}>Mes paramètres</Text>
        <View style={s.group}>
          <ThemeRow />
          <SettingsRow
            icon="moon-outline"
            iconBg={C.sleepBg}
            iconInk={C.sleepInk}
            label="Sommeil"
            value={sleepValue}
            onPress={() => router.push('/profile/sleep')}
          />
          <SettingsRow
            icon="restaurant-outline"
            iconBg={C.mealBg}
            iconInk={C.mealInk}
            label="Repas"
            value={mealsValue}
            onPress={() => router.push('/profile/meals')}
          />
          <SettingsRow
            icon="flower-outline"
            iconBg={C.activityBg}
            iconInk={C.activityInk}
            label="Cycle menstruel"
            value={cycleValue}
            onPress={() => router.push('/profile/cycle')}
          />
        </View>

        {/* Integrations */}
        <Text style={[s.sectionLabel, { marginTop: Spacing.xl }]}>Intégrations</Text>
        <View style={s.group}>
          <SettingsRow
            icon="calendar-outline"
            iconBg={C.primaryTint}
            iconInk={C.primary}
            label="Calendrier & Santé"
            value="Synchroniser avec ton appareil"
            onPress={() => router.push('/profile/calendar')}
          />
        </View>

        {/* About */}
        <Text style={[s.sectionLabel, { marginTop: Spacing.xl }]}>À propos</Text>
        <View style={s.group}>
          <SettingsRow
            icon="information-circle-outline"
            iconBg={C.surfaceSunk}
            iconInk={C.ink2}
            label="Version"
            value="1.0.0 — Dona"
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            iconBg={C.surfaceSunk}
            iconInk={C.ink2}
            label="Confidentialité"
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={s.signOutBtn}
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={s.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:    { flex: 1, backgroundColor: C.background },
    scroll:  { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },

    avatarSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.base,
      paddingVertical: Spacing.xl,
    },
    avatar: {
      width: 64, height: 64, borderRadius: 20,
      backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { fontSize: 28, fontWeight: '800', color: C.onPrimary },

    screenTitle: { fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
    editHint:    { fontSize: FontSize.sm, color: C.ink3, marginTop: 2 },
    goalBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: C.primaryTint,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      marginTop: 6, alignSelf: 'flex-start',
    },
    goalText: { fontSize: FontSize.xs, fontWeight: '700', color: C.primaryStrong },

    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: C.ink3,
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.md,
    },
    group: { gap: Spacing.md },

    signOutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, marginTop: Spacing.xl, marginBottom: Spacing.lg,
      paddingVertical: Spacing.base,
      backgroundColor: '#FEE2E2',
      borderRadius: Radius.pill,
    },
    signOutText: { fontSize: FontSize.base, fontWeight: '700', color: '#DC2626' },

    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    tag: {
      backgroundColor: C.primaryTint, borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md, paddingVertical: 7,
    },
    tagText: { fontSize: FontSize.sm, fontWeight: '700', color: C.primaryStrong },
  });
}
