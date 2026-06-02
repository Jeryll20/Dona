import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stepper } from '@/components/ui/Stepper';
import { PhaseCard } from '@/components/cycle/PhaseCard';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { scheduleAllNotifications, cancelCycleReminder } from '@/lib/notifications';
import { getCycleStatus, toISODate } from '@/lib/cycle';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function CycleScreen() {
  const { cycle, setCycle } = useUserStore();
  const todayEvents = useScheduleStore((s) => s.todayEvents);

  const [tracking,        setTracking]        = useState(cycle.tracking ?? false);
  const [cycleDays,       setCycleDays]       = useState(cycle.cycleDays ?? 28);
  const [lastPeriodDate,  setLastPeriodDate]  = useState<Date | null>(
    cycle.lastPeriodDate ? new Date(cycle.lastPeriodDate) : null,
  );
  const [showPicker, setShowPicker] = useState(false);

  const cycleStatus =
    tracking && lastPeriodDate
      ? getCycleStatus(toISODate(lastPeriodDate), cycleDays)
      : null;

  function handleDateChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setLastPeriodDate(selected);
  }

  function handleSave() {
    setCycle({
      tracking,
      cycleDays,
      lastPeriodDate: lastPeriodDate ? toISODate(lastPeriodDate) : undefined,
    });
    if (tracking) {
      scheduleAllNotifications({
        events:         todayEvents,
        cycleTracking:  true,
        lastPeriodDate: lastPeriodDate ? toISODate(lastPeriodDate) : undefined,
        cycleDays,
      });
    } else {
      cancelCycleReminder();
    }
    router.back();
  }

  const dateLabel = lastPeriodDate
    ? lastPeriodDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Choisir une date';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cycle menstruel</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle suivi */}
        <View style={styles.card}>
          <View style={styles.trackingRow}>
            <View style={styles.trackingText}>
              <Text style={styles.trackingLabel}>Activer le suivi de cycle</Text>
              <Text style={styles.trackingDesc}>
                Dona adapte tes suggestions selon ta phase hormonale.
              </Text>
            </View>
            <Switch
              value={tracking}
              onValueChange={setTracking}
              trackColor={{ false: Colors.light.hairline, true: Colors.light.primary }}
              thumbColor={Colors.light.surface}
              accessibilityLabel="Activer le suivi de cycle"
            />
          </View>
        </View>

        {tracking && (
          <>
            {/* Durée du cycle */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Durée de ton cycle</Text>
              <View style={styles.card}>
                <Stepper value={cycleDays} setValue={setCycleDays} min={21} max={45} suffix=" j" />
              </View>
            </View>

            {/* Date des dernières règles */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Dernières règles</Text>
              <TouchableOpacity
                style={styles.dateRow}
                onPress={() => setShowPicker(true)}
                accessibilityLabel="Choisir la date des dernières règles"
                accessibilityRole="button"
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.light.primary} />
                <Text style={styles.dateText}>{dateLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.ink3} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {showPicker && (
                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    value={lastPeriodDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                    locale="fr-FR"
                    accentColor={Colors.light.primary}
                    textColor={Colors.light.ink}
                    themeVariant="light"
                    accessibilityLabel="Sélecteur de date"
                  />
                </View>
              )}
            </View>

            {/* PhaseCard */}
            {cycleStatus && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Ta phase actuelle</Text>
                <PhaseCard status={cycleStatus} />
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer"
        >
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.input,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.3 },

  scroll:   { flex: 1 },
  content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.xl },

  section: { gap: Spacing.sm },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    paddingHorizontal: Spacing.base,
    ...Shadow.sm,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
  },
  trackingText:  { flex: 1 },
  trackingLabel: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink },
  trackingDesc:  { fontSize: FontSize.sm, color: Colors.light.ink3, marginTop: 4, lineHeight: 18 },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    ...Shadow.sm,
  },
  dateText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },

  pickerWrap: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    alignItems: 'center',
    ...Shadow.sm,
  },

  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },
});
