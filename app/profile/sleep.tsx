import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TimeField } from '@/components/ui/TimeField';
import { Stepper } from '@/components/ui/Stepper';
import { useUserStore } from '@/store/useUserStore';
import { scheduleAllNotifications } from '@/lib/notifications';
import { buildDefaultDay } from '@/lib/optimizer';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function SleepScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const { sleep, meals, setSleep, cycle } = useUserStore();
  const [bedtime,    setBedtime]    = useState(sleep.bedtime    ?? '23:00');
  const [waketime,   setWaketime]   = useState(sleep.waketime   ?? '07:00');
  const [sleepHours, setSleepHours] = useState(sleep.sleepHours ?? 8);
  const [prepMins,   setPrepMins]   = useState(sleep.prepMinutes ?? 40);

  function handleSave() {
    setSleep({ bedtime, waketime, sleepHours, prepMinutes: prepMins });
    const events = buildDefaultDay({ bedtime, waketime, prepMinutes: prepMins }, meals);
    scheduleAllNotifications({
      events,
      cycleTracking:  cycle.tracking ?? false,
      lastPeriodDate: cycle.lastPeriodDate,
      cycleDays:      cycle.cycleDays,
    });
    router.back();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Sommeil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>Heure de coucher</Text>
          <View style={s.card}>
            <TimeField value={bedtime} onChange={setBedtime} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Heure de réveil</Text>
          <View style={s.card}>
            <TimeField value={waketime} onChange={setWaketime} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Durée de sommeil souhaitée</Text>
          <View style={s.card}>
            <Stepper value={sleepHours} setValue={setSleepHours} min={5} max={11} suffix="h" />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Temps de préparation le matin</Text>
          <View style={s.card}>
            <Stepper value={prepMins} setValue={setPrepMins} min={10} max={90} suffix=" min" />
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Enregistrer">
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

    scroll:  { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.xl },

    section:      { gap: Spacing.sm },
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
