import { StyleSheet, View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stepper } from '@/components/ui/Stepper';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function CycleScreen() {
  const { cycle, setCycle } = useUserStore();
  const [tracking,   setTracking]   = useState(cycle.tracking ?? false);
  const [cycleDays,  setCycleDays]  = useState(cycle.cycleDays ?? 28);

  function handleSave() {
    setCycle({ tracking, cycleDays });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cycle menstruel</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
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
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Durée de ton cycle</Text>
            <View style={styles.card}>
              <Stepper value={cycleDays} setValue={setCycleDays} min={21} max={45} suffix=" j" />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Enregistrer">
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
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

  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.xl },
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

  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },
});
