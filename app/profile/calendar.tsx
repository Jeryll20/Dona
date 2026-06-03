import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import { requestCalendarPermission, exportAllActivitiesToCalendar } from '@/lib/calendar';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function CalendarScreen() {
  const activities = useScheduleStore((s) => s.activities);
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Intégrations</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Calendrier ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBadge, { backgroundColor: Colors.light.primaryTint }]}>
            <Ionicons name="calendar-outline" size={18} color={Colors.light.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Calendrier natif</Text>
            <Text style={styles.sectionSub}>
              Exporte tes activités vers le calendrier de ton appareil
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Exporter mes activités</Text>
              <Text style={styles.cardSub}>
                {activities.length === 0
                  ? 'Aucune activité à exporter'
                  : `${activities.length} activité${activities.length > 1 ? 's' : ''} dans ton planning`}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.exportBtn, (exporting || activities.length === 0) && styles.exportBtnOff]}
              onPress={handleExport}
              disabled={exporting || activities.length === 0}
              accessibilityLabel="Exporter mes activités vers le calendrier"
              accessibilityRole="button"
            >
              <Text style={[styles.exportBtnText, activities.length === 0 && styles.exportBtnTextOff]}>
                {exporting ? 'Export…' : 'Exporter'}
              </Text>
            </TouchableOpacity>
          </View>

          {exportedCount !== null && (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.light.mealInk} />
              <Text style={styles.successText}>
                {exportedCount} activité{exportedCount > 1 ? 's' : ''} exportée{exportedCount > 1 ? 's' : ''} avec succès
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.hint}>
          Un calendrier "Dona" dédié sera créé sur ton appareil. Tes activités récurrentes y apparaîtront avec leurs horaires exacts.
        </Text>

        {/* ── Santé (coming soon) ─────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={[styles.iconBadge, { backgroundColor: Colors.light.activityBg }]}>
            <Ionicons name="fitness-outline" size={18} color={Colors.light.activityInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Santé</Text>
            <Text style={styles.sectionSub}>Apple Health & Google Fit</Text>
          </View>
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>Bientôt</Text>
          </View>
        </View>

        <View style={[styles.card, styles.cardDisabled]}>
          {[
            { icon: 'heart-outline' as const, label: 'Apple Health' },
            { icon: 'pulse-outline'  as const, label: 'Google Fit'   },
          ].map(({ icon, label }, i) => (
            <View key={label}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.disabledRow}>
                <Ionicons name={icon} size={18} color={Colors.light.ink3} />
                <Text style={styles.disabledLabel}>{label}</Text>
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>Bientôt</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.hint}>
          Synchronisation des pas, du sommeil et de la fréquence cardiaque — disponible dans une prochaine mise à jour.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.hairline,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.light.ink,
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
    color: Colors.light.ink,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
    marginTop: 2,
  },

  card: {
    backgroundColor: Colors.light.surface,
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
    color: Colors.light.ink,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
    marginTop: 2,
  },

  exportBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexShrink: 0,
  },
  exportBtnOff: {
    backgroundColor: Colors.light.surfaceSunk,
  },
  exportBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.onPrimary,
  },
  exportBtnTextOff: {
    color: Colors.light.ink3,
  },

  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.hairline,
  },
  successText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.mealInk,
  },

  hint: {
    fontSize: FontSize.xs,
    color: Colors.light.ink3,
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
    color: Colors.light.ink3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.hairline,
  },

  soonBadge: {
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  soonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primaryStrong,
  },
});
