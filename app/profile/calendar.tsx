import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import { requestCalendarPermission, exportAllActivitiesToCalendar } from '@/lib/calendar';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function CalendarScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const activities = useScheduleStore((st) => st.activities);
  const [exporting, setExporting]           = useState(false);
  const [exportedCount, setExportedCount]   = useState<number | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const granted = await requestCalendarPermission();
      if (!granted) {
        Alert.alert(
          'Permission refusée',
          "Dona a besoin d'accéder à ton calendrier. Active la permission dans les Réglages de ton appareil.",
        );
        return;
      }
      const { success } = await exportAllActivitiesToCalendar(activities);
      setExportedCount(success);
      Alert.alert(
        'Export réussi',
        `${success} activité${success > 1 ? 's' : ''} ajoutée${success > 1 ? 's' : ''} au calendrier "Dona".`,
      );
    } catch {
      Alert.alert('Erreur', "Impossible d'accéder au calendrier. Réessaie dans les Réglages.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Intégrations</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Calendrier ─────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <View style={[s.iconBadge, { backgroundColor: C.primaryTint }]}>
            <Ionicons name="calendar-outline" size={18} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>Calendrier natif</Text>
            <Text style={s.sectionSub}>
              Exporte tes activités vers le calendrier de ton appareil
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardLabel}>Exporter mes activités</Text>
              <Text style={s.cardSub}>
                {activities.length === 0
                  ? 'Aucune activité à exporter'
                  : `${activities.length} activité${activities.length > 1 ? 's' : ''} dans ton planning`}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.exportBtn, (exporting || activities.length === 0) && s.exportBtnOff]}
              onPress={handleExport}
              disabled={exporting || activities.length === 0}
              accessibilityLabel="Exporter mes activités vers le calendrier"
              accessibilityRole="button"
            >
              <Text style={[s.exportBtnText, activities.length === 0 && s.exportBtnTextOff]}>
                {exporting ? 'Export…' : 'Exporter'}
              </Text>
            </TouchableOpacity>
          </View>

          {exportedCount !== null && (
            <View style={s.successRow}>
              <Ionicons name="checkmark-circle" size={14} color={C.mealInk} />
              <Text style={s.successText}>
                {exportedCount} activité{exportedCount > 1 ? 's' : ''} exportée{exportedCount > 1 ? 's' : ''} avec succès
              </Text>
            </View>
          )}
        </View>

        <Text style={s.hint}>
          Un calendrier "Dona" dédié sera créé sur ton appareil. Tes activités récurrentes y apparaîtront avec leurs horaires exacts.
        </Text>

        {/* ── Santé (coming soon) ─────────────────────────────────── */}
        <View style={[s.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={[s.iconBadge, { backgroundColor: C.activityBg }]}>
            <Ionicons name="fitness-outline" size={18} color={C.activityInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>Santé</Text>
            <Text style={s.sectionSub}>Apple Health & Google Fit</Text>
          </View>
          <View style={s.soonBadge}>
            <Text style={s.soonText}>Bientôt</Text>
          </View>
        </View>

        <View style={[s.card, s.cardDisabled]}>
          {[
            { icon: 'heart-outline' as const, label: 'Apple Health' },
            { icon: 'pulse-outline'  as const, label: 'Google Fit'   },
          ].map(({ icon, label }, i) => (
            <View key={label}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.disabledRow}>
                <Ionicons name={icon} size={18} color={C.ink3} />
                <Text style={s.disabledLabel}>{label}</Text>
                <View style={s.soonBadge}>
                  <Text style={s.soonText}>Bientôt</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.hint}>
          Synchronisation des pas, du sommeil et de la fréquence cardiaque — disponible dans une prochaine mise à jour.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: C.hairline,
    },
    backBtn: {
      width: 36, height: 36,
      borderRadius: Radius.pill,
      backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    title: {
      fontSize: FontSize.lg,
      fontWeight: '800',
      color: C.ink,
      letterSpacing: -0.3,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    iconBadge: {
      width: 42, height: 42,
      borderRadius: 13,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    sectionTitle: {
      fontSize: FontSize.base,
      fontWeight: '700',
      color: C.ink,
      letterSpacing: -0.2,
    },
    sectionSub: {
      fontSize: FontSize.sm,
      color: C.ink3,
      marginTop: 2,
    },

    card: {
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      padding: Spacing.base,
      ...Shadow.sm,
    },
    cardDisabled: {
      opacity: 0.6,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    cardLabel: {
      fontSize: FontSize.base,
      fontWeight: '700',
      color: C.ink,
      letterSpacing: -0.2,
    },
    cardSub: {
      fontSize: FontSize.sm,
      color: C.ink3,
      marginTop: 2,
    },

    exportBtn: {
      backgroundColor: C.primary,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      flexShrink: 0,
    },
    exportBtnOff: {
      backgroundColor: C.surfaceSunk,
    },
    exportBtnText: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: C.onPrimary,
    },
    exportBtnTextOff: {
      color: C.ink3,
    },

    successRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: C.hairline,
    },
    successText: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: C.mealInk,
    },

    hint: {
      fontSize: FontSize.xs,
      color: C.ink3,
      lineHeight: 18,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },

    disabledRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    disabledLabel: {
      flex: 1,
      fontSize: FontSize.base,
      fontWeight: '600',
      color: C.ink3,
    },
    divider: {
      height: 1,
      backgroundColor: C.hairline,
    },

    soonBadge: {
      backgroundColor: C.primaryTint,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    soonText: {
      fontSize: 11,
      fontWeight: '700',
      color: C.primaryStrong,
    },
  });
}
