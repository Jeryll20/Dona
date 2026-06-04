import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { FontSize } from '@/constants/typography';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { CAT } from '@/constants/categories';
import { Icon } from '@/components/ui/Icon';
import { TopSafe } from '@/components/ui/TopSafe';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useBehaviorStore } from '@/store/useBehaviorStore';
import { useUserStore } from '@/store/useUserStore';
import { analyzePatterns, computeWeekStats, getLastMondayISO } from '@/lib/behaviorAnalysis';
import { generateWeeklyInsights } from '@/lib/ai';
import type { PatternInsight, CatKey, WeeklyReport } from '@/types';

const CAT_LABELS: Record<CatKey, string> = {
  sommeil:  'Sommeil',
  prep:     'Préparation',
  travail:  'Travail',
  sport:    'Sport',
  activite: 'Activité',
  trajet:   'Trajet',
  repas:    'Repas',
};

function fmtH(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, '0')}`;
}

function RingProgress({ value, size = 60 }: { value: number; size?: number }) {
  const C = useColors();
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? C.mealInk : pct >= 50 ? C.primary : C.activityInk;
  const s = makeStyles(C);
  return (
    <View style={[s.ringWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[s.ringOuter, { width: size, height: size, borderRadius: size / 2, borderColor: color }]} />
      <Text style={[s.ringPct, { color }]}>{pct}%</Text>
    </View>
  );
}

function PatternCard({ insight, onAccept }: { insight: PatternInsight; onAccept: () => void }) {
  const C = useColors();
  const s = makeStyles(C);
  const iconMap: Record<string, string> = {
    low_completion: 'target',
    day_skip:       'calendar',
    time_drift:     'clock',
  };
  return (
    <View style={s.patternCard}>
      <View style={s.patternHeader}>
        <View style={s.patternIcon}>
          <Icon name={iconMap[insight.type] ?? 'spark'} size={16} stroke={C.primary} sw={2} />
        </View>
        <Text style={s.patternTitle} numberOfLines={1}>{insight.activityTitle}</Text>
      </View>
      <Text style={s.patternDetail}>{insight.detail}</Text>
      <View style={s.patternSuggestion}>
        <Icon name="spark" size={14} stroke={C.ink3} sw={1.8} />
        <Text style={s.patternSuggestionText}>{insight.suggestion}</Text>
      </View>
      <TouchableOpacity style={s.acceptBtn} onPress={onAccept} accessibilityLabel="Appliquer la suggestion">
        <Text style={s.acceptBtnText}>Appliquer</Text>
        <Icon name="check" size={14} stroke={C.primary} sw={2.2} />
      </TouchableOpacity>
    </View>
  );
}

export default function WeeklyReportScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const { activities, overrides, customCategories } = useScheduleStore();
  const { completions, weeklyReport, setWeeklyReport } = useBehaviorStore();
  const { profile } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [report, setReport]   = useState<WeeklyReport | null>(weeklyReport);

  // Regenerate whenever the store cache is cleared (e.g. after marking a completion)
  useEffect(() => {
    if (weeklyReport === null && !loading) {
      setReport(null);
      generateReport();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyReport]);

  async function generateReport() {
    setLoading(true);
    try {
      const weekStart = getLastMondayISO();
      const { completionRate, categoryStats, customCatStats } = computeWeekStats(activities, completions, weekStart, customCategories);
      const patterns  = analyzePatterns(activities, completions, overrides);

      const mistralInsights = await generateWeeklyInsights({
        completionRate,
        patterns: patterns.map((p) => ({
          title:      p.activityTitle,
          detail:     p.detail,
          suggestion: p.suggestion,
        })),
        activitiesCount: activities.length,
        firstName:       profile.firstName,
      });

      const newReport: WeeklyReport = {
        weekStart,
        completionRate,
        categoryStats,
        customCatStats,
        patterns,
        mistralInsights,
        generatedAt: new Date().toISOString(),
      };
      setWeeklyReport(newReport);
      setReport(newReport);
    } catch {
      Alert.alert('Erreur', 'Impossible de générer le rapport. Vérifie ta connexion.');
    } finally {
      setLoading(false);
    }
  }

  function handleAcceptPattern(insight: PatternInsight) {
    Alert.alert(
      'Appliquer la suggestion ?',
      insight.suggestion,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, appliquer',
          onPress: () => {
            router.push('/activities' as never);
          },
        },
      ],
    );
  }

  return (
    <View style={s.root}>
      <TopSafe />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Retour">
          <Icon name="back" size={22} stroke={C.ink} sw={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bilan de la semaine</Text>
        <TouchableOpacity onPress={generateReport} accessibilityLabel="Actualiser le bilan">
          <Text style={s.refreshText}>Actualiser</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Analyse en cours…</Text>
        </View>
      ) : report ? (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Completion ring */}
          <View style={s.completionCard}>
            <RingProgress value={report.completionRate} size={80} />
            <View style={s.completionInfo}>
              <Text style={s.completionLabel}>Taux de réalisation</Text>
              <Text style={s.completionSub}>
                {report.completionRate >= 0.8
                  ? 'Excellente semaine !'
                  : report.completionRate >= 0.5
                  ? 'Bonne progression'
                  : 'Des efforts à faire'}
              </Text>
              <Text style={s.completionWeek}>Semaine du {formatWeekDate(report.weekStart)}</Text>
            </View>
          </View>

          {/* AI insights */}
          {report.mistralInsights ? (
            <View style={s.insightsCard}>
              <View style={s.insightsHeader}>
                <Icon name="spark" size={16} stroke={C.primary} sw={2} />
                <Text style={s.insightsTitle}>Analyse Dona</Text>
              </View>
              <Text style={s.insightsText}>{report.mistralInsights}</Text>
            </View>
          ) : null}

          {/* Category stats */}
          {(Object.entries(report.categoryStats).length > 0 || Object.entries(report.customCatStats ?? {}).length > 0) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Par catégorie</Text>
              {(Object.entries(report.categoryStats) as [CatKey, { planned: number; done: number }][]).map(
                ([cat, stat]) => {
                  const c   = CAT[cat];
                  const pct = stat.planned > 0 ? stat.done / stat.planned : 0;
                  return (
                    <View key={cat} style={s.catRow}>
                      <View style={[s.catDot, { backgroundColor: c.bg }]}>
                        <Icon name={c.icon as never} size={12} stroke={c.ink} sw={2} />
                      </View>
                      <Text style={s.catLabel}>{CAT_LABELS[cat]}</Text>
                      <View style={s.catBar}>
                        <View style={[s.catBarFill, { width: `${Math.round(pct * 100)}%` as never, backgroundColor: c.ink }]} />
                      </View>
                      <Text style={s.catHours}>{fmtH(stat.done)}<Text style={s.catHoursPlanned}>/{fmtH(stat.planned)}</Text></Text>
                    </View>
                  );
                },
              )}
              {Object.entries(report.customCatStats ?? {}).map(([id, stat]) => {
                const pct = stat.planned > 0 ? stat.done / stat.planned : 0;
                return (
                  <View key={id} style={s.catRow}>
                    <View style={[s.catDot, { backgroundColor: stat.color.bg }]}>
                      <View style={[s.customCatDot, { backgroundColor: stat.color.ink }]} />
                    </View>
                    <Text style={s.catLabel}>{stat.label}</Text>
                    <View style={s.catBar}>
                      <View style={[s.catBarFill, { width: `${Math.round(pct * 100)}%` as never, backgroundColor: stat.color.ink }]} />
                    </View>
                    <Text style={s.catHours}>{fmtH(stat.done)}<Text style={s.catHoursPlanned}>/{fmtH(stat.planned)}</Text></Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Pattern insights */}
          {report.patterns.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Tendances détectées</Text>
              {report.patterns.map((p, i) => (
                <PatternCard key={i} insight={p} onAccept={() => handleAcceptPattern(p)} />
              ))}
            </View>
          )}

          {report.patterns.length === 0 && (
            <View style={s.noPatterns}>
              <Icon name="check" size={24} stroke={C.mealInk} sw={2} />
              <Text style={s.noPatternsText}>Aucune tendance négative détectée. Continue comme ça !</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>Appuie sur le bouton pour générer ton bilan.</Text>
        </View>
      )}
    </View>
  );
}

function formatWeekDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    header: {
      flexDirection:  'row',
      alignItems:     'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical:   Spacing.md,
    },
    backBtn:     { padding: Spacing.xs, marginRight: Spacing.sm },
    refreshText: { fontSize: FontSize.sm, fontWeight: '700', color: C.primary },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: C.ink, flex: 1 },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    loadingText: { fontSize: FontSize.base, color: C.ink2 },

    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.lg, gap: Spacing.md },

    // Completion ring card
    completionCard: {
      backgroundColor: C.surface,
      borderRadius:    Radius.card,
      padding:         Spacing.lg,
      flexDirection:   'row',
      alignItems:      'center',
      gap:             Spacing.lg,
      ...Shadow.sm,
    },
    ringWrap: {
      alignItems:      'center',
      justifyContent:  'center',
      position:        'relative',
    },
    ringOuter: {
      position:    'absolute',
      borderWidth: 5,
      opacity:     0.9,
    },
    ringPct: {
      fontSize:   FontSize.lg,
      fontWeight: '800',
    },
    completionInfo:   { flex: 1 },
    completionLabel:  { fontSize: FontSize.sm, color: C.ink3, fontWeight: '600' },
    completionSub:    { fontSize: FontSize.base, color: C.ink, fontWeight: '700', marginTop: 2 },
    completionWeek:   { fontSize: FontSize.xs, color: C.ink3, marginTop: 4 },

    // AI insights card
    insightsCard: {
      backgroundColor: C.primaryTint,
      borderRadius:    Radius.block,
      padding:         Spacing.md,
      gap:             Spacing.xs,
    },
    insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    insightsTitle:  { fontSize: FontSize.sm, fontWeight: '700', color: C.primaryStrong },
    insightsText:   { fontSize: FontSize.sm, color: C.ink, lineHeight: 20 },

    // Section
    section:      { gap: Spacing.sm },
    sectionTitle: { fontSize: FontSize.base, fontWeight: '800', color: C.ink },

    // Category rows
    catRow: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             Spacing.sm,
      backgroundColor: C.surface,
      borderRadius:    Radius.input,
      padding:         Spacing.sm,
      ...Shadow.sm,
    },
    catDot: {
      width: 26, height: 26, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    customCatDot: { width: 10, height: 10, borderRadius: 5 },
    catLabel:   { fontSize: FontSize.sm, fontWeight: '600', color: C.ink, width: 80 },
    catBar:     { flex: 1, height: 6, backgroundColor: C.hairline, borderRadius: 3, overflow: 'hidden' },
    catBarFill: { height: 6, borderRadius: 3 },
    catHours:   { fontSize: FontSize.sm, fontWeight: '700', color: C.ink, width: 52, textAlign: 'right' },
    catHoursPlanned: { fontWeight: '400', color: C.ink3 },

    // Pattern cards
    patternCard: {
      backgroundColor: C.surface,
      borderRadius:    Radius.block,
      padding:         Spacing.md,
      gap:             Spacing.xs,
      ...Shadow.sm,
    },
    patternHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    patternIcon:   {
      width: 28, height: 28, borderRadius: 8,
      backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    patternTitle:  { fontSize: FontSize.base, fontWeight: '700', color: C.ink, flex: 1 },
    patternDetail: { fontSize: FontSize.sm, color: C.ink2, lineHeight: 19 },
    patternSuggestion: {
      flexDirection:   'row',
      alignItems:      'flex-start',
      gap:             Spacing.xs,
      backgroundColor: C.surfaceSunk,
      borderRadius:    Radius.input,
      padding:         Spacing.sm,
    },
    patternSuggestionText: { fontSize: FontSize.sm, color: C.ink2, flex: 1, lineHeight: 19 },
    acceptBtn: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'flex-end',
      gap:             Spacing.xs,
      paddingTop:      Spacing.xs,
    },
    acceptBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: C.primary },

    // No patterns
    noPatterns: {
      alignItems:      'center',
      gap:             Spacing.sm,
      paddingVertical: Spacing.xl,
    },
    noPatternsText: { fontSize: FontSize.base, color: C.ink2, textAlign: 'center' },
  });
}
