import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

interface GhostButtonProps extends TouchableOpacityProps {
  label: string;
}

export function GhostButton({ label, style, ...rest }: GhostButtonProps) {
  const C = useColors();
  const s = makeStyles(C);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[s.btn, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...rest}
    >
      <Text style={s.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    btn: {
      backgroundColor: C.surface,
      borderRadius: Radius.pill,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    label: {
      color: C.ink,
      fontSize: FontSize.base,
      fontWeight: '600',
    },
  });
}
