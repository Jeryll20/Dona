import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface OptionRowProps {
  label: string;
  sub?: string;
  icon?: IoniconsName;
  selected?: boolean;
  multi?: boolean;   // checkbox vs radio
  onPress: () => void;
}

// Selectable list option — matches CLAUDE.md § OptionRow component
export function OptionRow({ label, sub, icon, selected = false, multi = false, onPress }: OptionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowActive]}
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      accessibilityLabel={label}
    >
      {icon && (
        <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
          <Ionicons
            name={icon}
            size={20}
            color={selected ? Colors.light.primaryStrong : Colors.light.ink2}
          />
        </View>
      )}

      <View style={styles.text}>
        <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>

      {multi ? (
        <View style={[styles.checkbox, selected && styles.checkboxActive]}>
          {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
      ) : (
        <View style={[styles.radio, selected && styles.radioActive]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  rowActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryTint,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapActive: { backgroundColor: Colors.light.primaryTint2 },
  text:         { flex: 1 },
  label:        { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },
  labelActive:  { color: Colors.light.primaryStrong },
  sub:          { fontSize: FontSize.sm, color: Colors.light.ink3, marginTop: 2 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.light.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
  radioDot:    { width: 9, height: 9, borderRadius: Radius.pill, backgroundColor: '#fff' },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.light.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
});
