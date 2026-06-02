import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/constants/Colors';
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
  return (
    <TouchableOpacity
      style={row.wrap}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityLabel={label}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <View style={[row.icon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconInk} />
      </View>
      <View style={row.content}>
        <Text style={row.label}>{label}</Text>
        {value ? <Text style={row.value}>{value}</Text> : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.light.ink3} />}
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.light.surface, borderRadius: Radius.block,
    padding: Spacing.base, ...Shadow.sm,
  },
  icon:    { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  label:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink, letterSpacing: -0.2 },
  value:   { fontSize: FontSize.sm, color: Colors.light.ink3, marginTop: 2 },
});

export default function ProfileScreen() {
  const { sleep, meals, sport, work, cycle } = useUserStore();
  const signOut = useAuthStore((s) => s.signOut);

  const goalKey = work.role ?? null;
  const goalLabel = goalKey ? GOAL_LABELS[goalKey] : null;

  const sleepValue = sleep.bedtime && sleep.waketime
    ? `${sleep.bedtime} → ${sleep.waketime}`
    : undefined;

  const mealsValue = meals.times
    ? `${meals.times.length} repas · ${meals.times.join(', ')}`
    : undefined;

  const cycleValue = cycle.tracking
    ? `Cycle ${cycle.cycleDays ?? 28} jours`
    : 'Non activé';

  const activitiesRaw = sport.activity ?? '';
  const activityTags = activitiesRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>D</Text>
          </View>
          <View>
            <Text style={styles.screenTitle}>Mon profil</Text>
            {goalLabel && (
              <View style={styles.goalBadge}>
                <Ionicons name="flag-outline" size={12} color={Colors.light.primaryStrong} />
                <Text style={styles.goalText}>{goalLabel}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings */}
        <Text style={styles.sectionLabel}>Mes paramètres</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="moon-outline"
            iconBg={Colors.light.sleepBg}
            iconInk={Colors.light.sleepInk}
            label="Sommeil"
            value={sleepValue}
            onPress={() => router.push('/profile/sleep')}
          />
          <SettingsRow
            icon="restaurant-outline"
            iconBg={Colors.light.mealBg}
            iconInk={Colors.light.mealInk}
            label="Repas"
            value={mealsValue}
          />
          <SettingsRow
            icon="flower-outline"
            iconBg={Colors.light.activityBg}
            iconInk={Colors.light.activityInk}
            label="Cycle menstruel"
            value={cycleValue}
            onPress={() => router.push('/profile/cycle')}
          />
        </View>

        {/* Rhythm */}
        {activityTags.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Mon rythme</Text>
            <View style={styles.tagsWrap}>
              {activityTags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* About */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>À propos</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="information-circle-outline"
            iconBg={Colors.light.surfaceSunk}
            iconInk={Colors.light.ink2}
            label="Version"
            value="1.0.0 — Dona"
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            iconBg={Colors.light.surfaceSunk}
            iconInk={Colors.light.ink2}
            label="Confidentialité"
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.light.background },
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
    backgroundColor: Colors.light.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: Colors.light.onPrimary },

  screenTitle: { fontSize: 26, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.5 },
  goalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginTop: 6, alignSelf: 'flex-start',
  },
  goalText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.light.primaryStrong },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
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
    backgroundColor: Colors.light.primaryTint, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
  },
  tagText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.light.primaryStrong },
});
