import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';

const HOUR_HEIGHT = 58;

type EventCategory = 'sleep' | 'prep' | 'work' | 'activity' | 'transit' | 'meal';

interface DayEvent {
  title: string;
  category: EventCategory;
  startHour: number;
  endHour: number;
  thin?: boolean;
  duration?: string;
}

const CATEGORY_STYLE: Record<EventCategory, { bg: string; ink: string }> = {
  sleep:    { bg: Colors.light.sleepBg,    ink: Colors.light.sleepInk },
  prep:     { bg: Colors.light.mealBg,     ink: Colors.light.mealInk },
  work:     { bg: Colors.light.workBg,     ink: Colors.light.workInk },
  activity: { bg: Colors.light.activityBg, ink: Colors.light.activityInk },
  transit:  { bg: Colors.light.transitBg,  ink: Colors.light.transitInk },
  meal:     { bg: Colors.light.mealBg,     ink: Colors.light.mealInk },
};

const DEMO_DAY: DayEvent[] = [
  { category: 'sleep',    title: 'Sommeil',         startHour: 0,     endHour: 7 },
  { category: 'prep',     title: 'Préparation',     startHour: 7,     endHour: 7.67 },
  { category: 'transit',  title: 'Trajet',           startHour: 7.67,  endHour: 8,    thin: true, duration: '20 min' },
  { category: 'work',     title: 'Travail',          startHour: 8,     endHour: 12.5 },
  { category: 'meal',     title: 'Déjeuner',         startHour: 12.5,  endHour: 13.5 },
  { category: 'work',     title: 'Travail',          startHour: 13.5,  endHour: 17 },
  { category: 'transit',  title: 'Retour',           startHour: 17,    endHour: 17.33, thin: true, duration: '20 min' },
  { category: 'activity', title: "Cours d'anglais", startHour: 18.17, endHour: 19.17 },
  { category: 'meal',     title: 'Dîner',            startHour: 20,    endHour: 20.75 },
  { category: 'sleep',    title: 'Sommeil',          startHour: 23,    endHour: 24 },
];

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function planningHours(events: DayEvent[]) {
  return events.filter((e) => !e.thin).reduce((sum, e) => sum + (e.endHour - e.startHour), 0);
}

export default function TodayScreen() {
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel} accessibilityLabel="Date du jour">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.title}>Aujourd'hui</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {Math.round(planningHours(DEMO_DAY))}h planifiées
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: 6 * HOUR_HEIGHT }}
      >
        <View style={[styles.timelineGrid, { minHeight: 24 * HOUR_HEIGHT }]}>
          {/* Hour lines */}
          {Array.from({ length: 25 }, (_, h) => (
            <View key={h} style={[styles.hourRow, { top: h * HOUR_HEIGHT }]}>
              <Text style={styles.hourLabel}>
                {h === 24 ? '00h' : `${String(h).padStart(2, '0')}h`}
              </Text>
              <View style={styles.hourLine} />
            </View>
          ))}

          {/* Now indicator */}
          <View style={[styles.nowLine, { top: nowHour * HOUR_HEIGHT }]}>
            <View style={styles.nowDot} />
            <View style={styles.nowTrack} />
          </View>

          {/* Events */}
          {DEMO_DAY.map((ev, i) => {
            const c = CATEGORY_STYLE[ev.category];
            const top = ev.startHour * HOUR_HEIGHT;
            const height = Math.max((ev.endHour - ev.startHour) * HOUR_HEIGHT, 18);

            if (ev.thin) {
              return (
                <View key={i} style={[styles.thinBlock, { top: top + 2, height: height - 4 }]}>
                  <View style={[styles.thinBar, { backgroundColor: c.ink }]} />
                  <Text style={[styles.thinTitle, { color: c.ink }]}>{ev.title}</Text>
                  {ev.duration && (
                    <Text style={styles.thinDur}>· {ev.duration}</Text>
                  )}
                </View>
              );
            }

            return (
              <View
                key={i}
                style={[styles.block, { top, height, backgroundColor: c.bg }]}
                accessibilityLabel={`${ev.title} from ${fmtHour(ev.startHour)} to ${fmtHour(ev.endHour)}`}
              >
                <Text style={[styles.blockTitle, { color: c.ink }]}>{ev.title}</Text>
                {height > 44 && (
                  <Text style={[styles.blockTime, { color: c.ink }]}>
                    {fmtHour(ev.startHour)} – {fmtHour(ev.endHour)}
                  </Text>
                )}
              </View>
            );
          })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  dateLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.primaryStrong,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.ink2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  timelineGrid: {
    position: 'relative',
    paddingLeft: 50,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourLabel: {
    width: 40,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink3,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.hairline,
    opacity: 0.7,
  },
  nowLine: {
    position: 'absolute',
    left: 42,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  nowDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  nowTrack: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.primary,
    opacity: 0.55,
    borderRadius: 2,
  },
  block: {
    position: 'absolute',
    left: 52,
    right: 4,
    borderRadius: 16,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  blockTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  blockTime: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    opacity: 0.78,
    marginTop: 3,
    marginLeft: 0,
  },
  thinBlock: {
    position: 'absolute',
    left: 52,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  thinBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 999,
    opacity: 0.5,
  },
  thinTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    opacity: 0.9,
  },
  thinDur: {
    fontSize: FontSize.xs,
    color: Colors.light.ink3,
  },
});
