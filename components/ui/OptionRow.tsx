import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface OptionRowProps {
  label: string;
  sub?: string;
  icon?: IoniconsName;
  selected?: boolean;
  multi?: boolean;
  onPress: () => void;
}

// Option (b): nested View with 2px primary bg as ring when selected.
// Outer always has padding: 2 + bg surface → when selected, bg switches to primary,
// making the 2px gap appear as an inset ring. Inner bg switches to primaryTint.
export function OptionRow({ label, sub, icon, selected = false, multi = false, onPress }: OptionRowProps) {
  const C = useColors();
  const s = makeStyles(C);

  return (
    <TouchableOpacity
      style={[s.outer, selected && s.outerActive]}
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      accessibilityLabel={label}
      activeOpacity={0.8}
    >
      <View style={[s.inner, selected && s.innerActive]}>
        {icon && (
          <View style={[s.iconWrap, selected && s.iconWrapActive]}>
            <Ionicons
              name={icon}
              size={20}
              color={selected ? C.primaryStrong : C.ink2}
            />
          </View>
        )}

        <View style={s.text}>
          <Text style={[s.label, selected && s.labelActive]}>{label}</Text>
          {sub && <Text style={s.sub}>{sub}</Text>}
        </View>

        {multi ? (
          <View style={[s.checkbox, selected && s.checkboxActive]}>
            {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
        ) : (
          <View style={[s.radio, selected && s.radioActive]}>
            {selected && <View style={s.radioDot} />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    // Outer acts as ring container: same bg as surface (invisible) or primary (ring) when selected
    outer: {
      borderRadius: Radius.input + 2,
      padding: 2,
      backgroundColor: C.surface,
      ...Shadow.sm,
    },
    outerActive: {
      backgroundColor: C.primary,
    },

    // Inner holds the content, switches to primaryTint when selected
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      padding: Spacing.base - 2,
    },
    innerActive: {
      backgroundColor: C.primaryTint,
    },

    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: C.surfaceSunk,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    iconWrapActive: { backgroundColor: C.primaryTint2 },

    text:        { flex: 1 },
    label:       { fontSize: FontSize.base, fontWeight: '600', color: C.ink },
    labelActive: { color: C.primaryStrong },
    sub:         { fontSize: FontSize.sm, color: C.ink3, marginTop: 2 },

    radio: {
      width: 22,
      height: 22,
      borderRadius: Radius.pill,
      borderWidth: 2,
      borderColor: C.hairline,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    radioActive: { borderColor: C.primary, backgroundColor: C.primary },
    radioDot:    { width: 9, height: 9, borderRadius: Radius.pill, backgroundColor: '#fff' },

    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: C.hairline,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxActive: { borderColor: C.primary, backgroundColor: C.primary },
  });
}
