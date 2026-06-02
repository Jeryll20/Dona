import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TimeField } from '@/components/ui/TimeField';
import { Stepper } from '@/components/ui/Stepper';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { buildDefaultDay } from '@/lib/optimizer';
import { scheduleAllNotifications } from '@/lib/notifications';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function SleepScreen() {
  const { sleep, setSleep, cycle } = useUserStore();
  const setTodayEvents = useScheduleStore((s) => s.setTodayEvents);
  const [bedtime,    setBedtime]    = useState(sleep.bedtime    ?? '23:00');
  const [waketime,   setWaketime]   = useState(sleep.waketime   ?? '07:00');
  const [sleepHours, setSleepHours] = useState(sleep.sleepHours ?? 8);
  const [prepMins,   setPrepMins]   = useState(sleep.prepMinutes ?? 40);

  function handleSave() {
    setSleep({ bedtime, waketime, sleepHours, prepMinutes: prepMins });
    const events = buildDefaultDay({ bedtime, waketime, prepMinutes: prepMins });
    setTodayEvents(events);
    scheduleAllNotifications({ events, cycleTracking: cycle.tracking ?? false });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sommeil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Heure de coucher</Text>
          <View style={styles.card}>
            <TimeField value={bedtime} onChange={setBedtime} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Heure de réveil</Text>
          <View style={styles.card}>
            <TimeField value={waketime} onChange={setWaketime} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Durée de sommeil souhaitée</Text>
          <View style={styles.card}>
            <Stepper value={sleepHours} setValue={setSleepHours} min={5} max={11} suffix="h" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Temps de préparation le matin</Text>
          <View style={styles.card}>
            <Stepper value={prepMins} setValue={setPrepMins} min={10} max={90} suffix=" min" />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Enregistrer">
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

  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.xl },

  section:      { gap: Spacing.sm },
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

  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },
});
