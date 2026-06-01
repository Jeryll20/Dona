import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';
import { useUserStore } from '@/store/useUserStore';

interface ProfileRowProps {
  title: string;
  subtitle?: string;
  bgColor: string;
  inkColor: string;
  onPress?: () => void;
}

function ProfileRow({ title, subtitle, bgColor, inkColor, onPress }: ProfileRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View style={[styles.rowIcon, { backgroundColor: bgColor }]} />
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      <Text style={styles.rowChev}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { profile, sleep, meals } = useUserStore();

  const name = profile.fullName || 'You';
  const sleepSub = sleep.bedtime
    ? `${sleep.bedtime} · ${sleep.wakeTime}`
    : undefined;
  const mealsSub = meals.times
    ? `${meals.times.length} meals per day`
    : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.title}>{Strings.profile.title}</Text>
            <Text style={styles.subtitle}>{name}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{Strings.profile.settings}</Text>
        <View style={styles.sectionGroup}>
          <ProfileRow
            title={Strings.profile.sleep}
            subtitle={sleepSub}
            bgColor={Colors.light.sleepBg}
            inkColor={Colors.light.sleepInk}
          />
          <ProfileRow
            title={Strings.profile.cycle}
            subtitle="Optional tracking"
            bgColor={Colors.light.activityBg}
            inkColor={Colors.light.activityInk}
          />
          <ProfileRow
            title={Strings.profile.meals}
            subtitle={mealsSub}
            bgColor={Colors.light.mealBg}
            inkColor={Colors.light.mealInk}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.onPrimary,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
    marginTop: 3,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },
  sectionGroup: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.2,
  },
  rowSub: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
    marginTop: 2,
  },
  rowChev: {
    fontSize: 22,
    color: Colors.light.ink3,
    lineHeight: 26,
  },
});
