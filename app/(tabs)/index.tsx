import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

const HH = 58; // px per hour — matches CLAUDE.md § Timeline rendering

const DEFAULT_DAY: TimelineEvent[] = [
  { cat: 'sommeil',  title: 'Sommeil',        start: 0,     end: 7 },
  { cat: 'prep',     title: 'Préparation',    start: 7,     end: 7.67 },
  { cat: 'trajet',   title: 'Trajet bureau',  start: 7.67,  end: 8,     thin: true, dur: '20 min' },
  { cat: 'travail',  title: 'Travail',        start: 8,     end: 12.5 },
  { cat: 'repas',    title: 'Déjeuner',       start: 12.5,  end: 13.5 },
  { cat: 'travail',  title: 'Travail',        start: 13.5,  end: 17 },
  { cat: 'trajet',   title: 'Trajet bureau',  start: 17,    end: 17.33, thin: true, dur: '20 min' },
  { cat: 'trajet',   title: 'Trajet activité',start: 18,    end: 18.17, thin: true, dur: '10 min' },
  { cat: 'activite', title: "Cours d'anglais",start: 18.17, end: 19.17 },
  { cat: 'repas',    title: 'Dîner',          start: 20,    end: 20.75 },
  { cat: 'sommeil',  title: 'Sommeil',        start: 23,    end: 24 },
];

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

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
          {/* Hour grid lines */}
          {Array.from({ length: 25 }, (_, h) => (
            <View key={h} style={[styles.hourRow, { top: h * HH }]}>
              <Text style={styles.hourLabel}>
                {h === 24 ? '00h' : `${String(h).padStart(2, '0')}h`}
              </Text>
              <View style={styles.hourLine} />
            </View>
          ))}

          {/* Now indicator */}
          <View style={[styles.nowLine, { top: nowHour * HH }]}>
            <View style={styles.nowDot} />
            <View style={styles.nowTrack} />
          </View>

          {/* Events */}
          {DEFAULT_DAY.map((ev, i) => {
            const c = CAT[ev.cat];
            const top    = ev.start * HH;
            const height = Math.max((ev.end - ev.start) * HH, 16);

            if (ev.thin) {
              return (
                <View key={i} style={[styles.thinBlock, { top: top + 2, height: height - 4 }]}
                  accessibilityLabel={`${ev.title}${ev.dur ? ' · ' + ev.dur : ''}`}>
                  <View style={[styles.thinBar, { backgroundColor: c.ink }]} />
                  <Text style={[styles.thinTitle, { color: c.ink }]}>{ev.title}</Text>
                  {ev.dur && <Text style={styles.thinDur}>· {ev.dur}</Text>}
                </View>
              );
            }

            return (
              <View
                key={i}
                style={[styles.block, { top, height, backgroundColor: c.bg }]}
                accessibilityLabel={`${ev.title}, ${fmtHour(ev.start)} à ${fmtHour(ev.end)}`}
              >
                <Text style={[styles.blockTitle, { color: c.ink }]}>{ev.title}</Text>
                {height > 44 && (
                  <Text style={[styles.blockTime, { color: c.ink }]}>
                    {fmtHour(ev.start)} – {fmtHour(ev.end)}
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
  nowDot:   { width: 9, height: 9, borderRadius: 999, backgroundColor: Colors.light.primary },
  nowTrack: { flex: 1, height: 2, backgroundColor: Colors.light.primary, opacity: 0.55, borderRadius: 2 },

  block: {
    position: 'absolute',
    left: 52,
    right: 4,
    borderRadius: 16,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  blockTitle: { fontSize: FontSize.base, fontWeight: '700', letterSpacing: -0.2 },
  blockTime:  { fontSize: FontSize.sm, fontWeight: '600', opacity: 0.78, marginTop: 3 },

  thinBlock: {
    position: 'absolute',
    left: 52,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  thinBar:   { width: 4, alignSelf: 'stretch', borderRadius: 999, opacity: 0.5 },
  thinTitle: { fontSize: FontSize.sm, fontWeight: '600', opacity: 0.9 },
  thinDur:   { fontSize: FontSize.xs, color: Colors.light.ink3 },
});
