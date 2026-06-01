import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

interface GhostButtonProps extends TouchableOpacityProps {
  label: string;
}

export function GhostButton({ label, style, ...rest }: GhostButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.btn, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...rest}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  label: {
    color: Colors.light.ink,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});
