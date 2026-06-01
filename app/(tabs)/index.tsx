import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { HourGrid } from '@/components/timeline/HourGrid';
import { NowIndicator } from '@/components/timeline/NowIndicator';
import { TimelineBlock } from '@/components/timeline/TimelineBlock';
import { ThinBlock } from '@/components/timeline/ThinBlock';
import type { TimelineEvent } from '@/types';

export const HH = 58; // px per hour — matches CLAUDE.md § Timeline rendering
const LEFT_OFFSET = 52;

const DEFAULT_DAY: TimelineEvent[] = [
  { cat: 'sommeil',  title: 'Sommeil',          start: 0,     end: 7 },
  { cat: 'prep',     title: 'Préparation',       start: 7,     end: 7.67 },
  { cat: 'trajet',   title: 'Trajet bureau',     start: 7.67,  end: 8,     thin: true, dur: '20 min' },
  { cat: 'travail',  title: 'Travail',           start: 8,     end: 12.5 },
  { cat: 'repas',    title: 'Déjeuner',          start: 12.5,  end: 13.5 },
  { cat: 'travail',  title: 'Travail',           start: 13.5,  end: 17 },
  { cat: 'trajet',   title: 'Trajet bureau',     start: 17,    end: 17.33, thin: true, dur: '20 min' },
  { cat: 'trajet',   title: 'Trajet activité',   start: 18,    end: 18.17, thin: true, dur: '10 min' },
  { cat: 'activite', title: "Cours d'anglais",   start: 18.17, end: 19.17 },
  { cat: 'repas',    title: 'Dîner',             start: 20,    end: 20.75 },
  { cat: 'sommeil',  title: 'Sommeil',           start: 23,    end: 24 },
];

function scheduledHours(events: TimelineEvent[]) {
  return events.filter((e) => !e.thin).reduce((sum, e) => sum + (e.end - e.start), 0);
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
            {Math.round(scheduledHours(DEFAULT_DAY))}h planifiées
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: 6 * HH }}
      >
        <View style={[styles.grid, { minHeight: 24 * HH }]}>
          <HourGrid hourHeight={HH} />
          <NowIndicator nowHour={nowHour} hourHeight={HH} />
          {DEFAULT_DAY.map((ev, i) =>
            ev.thin
              ? <ThinBlock    key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} />
              : <TimelineBlock key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.light.background },
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
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  badgeText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.light.ink2 },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },

  grid: { position: 'relative', paddingLeft: 50 },
});
