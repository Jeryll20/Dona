import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { CycleStatus } from '@/lib/cycle';

interface PhaseCardProps {
  status: CycleStatus;
}

export function PhaseCard({ status }: PhaseCardProps) {
  const { phase, phaseInfo, dayInCycle, daysUntilPeriod, nextPeriodDate } = status;

  return (
    <View style={[styles.card, { backgroundColor: phaseInfo.bg }]}>
      <View style={styles.top}>
        <View>
          <Text style={[styles.phaseLabel, { color: phaseInfo.ink }]}>
            Phase {phaseInfo.label}
          </Text>
          <Text style={[styles.dayRange, { color: phaseInfo.ink }]}>
            {phaseInfo.dayRange} · Jour {dayInCycle}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: phaseInfo.ink }]}>
          <Text style={styles.badgeText}>J{dayInCycle}</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: phaseInfo.ink }]}>
        {phaseInfo.description}
      </Text>

      <View style={styles.divider} />

      <View style={styles.adviceGrid}>
        <AdviceRow icon="🏃" label="Sport"      value={phaseInfo.advice.sport}     ink={phaseInfo.ink} />
        <AdviceRow icon="🥗" label="Nutrition"  value={phaseInfo.advice.nutrition} ink={phaseInfo.ink} />
        <AdviceRow icon="💭" label="Humeur"     value={phaseInfo.advice.mood}      ink={phaseInfo.ink} />
        <AdviceRow icon="😴" label="Repos"      value={phaseInfo.advice.rest}      ink={phaseInfo.ink} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.nextPeriod, { color: phaseInfo.ink }]}>
          Prochaines règles dans{' '}
          <Text style={styles.nextPeriodBold}>{daysUntilPeriod} j</Text>
          {' '}· {nextPeriodDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </Text>
      </View>
    </View>
  );
}

function AdviceRow({ icon, label, value, ink }: {
  icon: string; label: string; value: string; ink: string;
}) {
  return (
    <View style={styles.adviceRow}>
      <Text style={styles.adviceIcon}>{icon}</Text>
      <View style={styles.adviceText}>
        <Text style={[styles.adviceLabel, { color: ink, opacity: 0.7 }]}>{label}</Text>
        <Text style={[styles.adviceValue, { color: ink }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  phaseLabel: { fontSize: FontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  dayRange:   { fontSize: FontSize.sm, fontWeight: '600', marginTop: 2, opacity: 0.8 },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  description: { fontSize: FontSize.md, lineHeight: 22, opacity: 0.85 },

  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: Spacing.xs,
  },

  adviceGrid: { gap: Spacing.sm },
  adviceRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  adviceIcon: { fontSize: 16, marginTop: 1 },
  adviceText: { flex: 1, gap: 1 },
  adviceLabel:{ fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  adviceValue:{ fontSize: FontSize.sm, fontWeight: '500', lineHeight: 18 },

  footer: { marginTop: Spacing.xs },
  nextPeriod:     { fontSize: FontSize.sm, opacity: 0.75 },
  nextPeriodBold: { fontWeight: '700' },
});
