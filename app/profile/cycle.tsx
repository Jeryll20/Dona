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
import { useColors, useIsDark } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function CycleScreen() {
  const C = useColors();
  const isDark = useIsDark();
  const s = makeStyles(C);
  const { cycle, setCycle } = useUserStore();
  const todayEvents = useScheduleStore((st) => st.todayEvents);

  const [tracking,        setTracking]        = useState(cycle.tracking ?? false);
  const [cycleDays,       setCycleDays]       = useState(cycle.cycleDays ?? 28);
  const [lastPeriodDate,  setLastPeriodDate]  = useState<Date | null>(
    cycle.lastPeriodDate ? new Date(cycle.lastPeriodDate) : null,
  );
  const [syncConsent, setSyncConsent] = useState(cycle.syncConsent ?? false);
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
      syncConsent,
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Cycle menstruel</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle suivi */}
        <View style={s.card}>
          <View style={s.trackingRow}>
            <View style={s.trackingText}>
              <Text style={s.trackingLabel}>Activer le suivi de cycle</Text>
              <Text style={s.trackingDesc}>
                Dona adapte tes suggestions selon ta phase hormonale.
              </Text>
            </View>
            <Switch
              value={tracking}
              onValueChange={setTracking}
              trackColor={{ false: C.hairline, true: C.primary }}
              thumbColor={C.surface}
              accessibilityLabel="Activer le suivi de cycle"
            />
          </View>
        </View>

        {tracking && (
          <>
            {/* Consentement sync cloud — données de santé (RGPD) */}
            <View style={s.card}>
              <View style={s.trackingRow}>
                <View style={s.trackingText}>
                  <Text style={s.trackingLabel}>Synchronisation cloud</Text>
                  <Text style={s.trackingDesc}>
                    Tes données de cycle restent sur cet appareil par défaut.
                    Active pour les retrouver sur tes autres appareils — tu peux
                    désactiver à tout moment, elles seront alors effacées du cloud.
                  </Text>
                </View>
                <Switch
                  value={syncConsent}
                  onValueChange={setSyncConsent}
                  trackColor={{ false: C.hairline, true: C.primary }}
                  thumbColor={C.surface}
                  accessibilityLabel="Synchroniser mes données de cycle dans le cloud"
                />
              </View>
            </View>

            {/* Durée du cycle */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Durée de ton cycle</Text>
              <View style={s.card}>
                <Stepper value={cycleDays} setValue={setCycleDays} min={21} max={45} suffix=" j" />
              </View>
            </View>

            {/* Date des dernières règles */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Dernières règles</Text>
              <TouchableOpacity
                style={s.dateRow}
                onPress={() => setShowPicker(true)}
                accessibilityLabel="Choisir la date des dernières règles"
                accessibilityRole="button"
              >
                <Ionicons name="calendar-outline" size={18} color={C.primary} />
                <Text style={s.dateText}>{dateLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.ink3} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {showPicker && (
                <View style={s.pickerWrap}>
                  <DateTimePicker
                    value={lastPeriodDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                    locale="fr-FR"
                    accentColor={C.primary}
                    textColor={C.ink}
                    themeVariant={isDark ? 'dark' : 'light'}
                    accessibilityLabel="Sélecteur de date"
                  />
                </View>
              )}
            </View>

            {/* PhaseCard */}
            {cycleStatus && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>Ta phase actuelle</Text>
                <PhaseCard status={cycleStatus} />
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer"
        >
          <Text style={s.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: Radius.input,
      backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: FontSize.lg, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },

    scroll:   { flex: 1 },
    content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.xl },

    section: { gap: Spacing.sm },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: C.ink3,
      textTransform: 'uppercase', letterSpacing: 0.6,
    },
    card: {
      backgroundColor: C.surface,
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
    trackingLabel: { fontSize: FontSize.base, fontWeight: '700', color: C.ink },
    trackingDesc:  { fontSize: FontSize.sm, color: C.ink3, marginTop: 4, lineHeight: 18 },

    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.base,
      ...Shadow.sm,
    },
    dateText: { fontSize: FontSize.base, fontWeight: '600', color: C.ink },

    pickerWrap: {
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      overflow: 'hidden',
      marginTop: Spacing.xs,
      alignItems: 'center',
      ...Shadow.sm,
    },

    saveBtn: {
      backgroundColor: C.primary,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.base,
      alignItems: 'center',
      ...Shadow.sm,
    },
    saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: C.onPrimary },
  });
}
