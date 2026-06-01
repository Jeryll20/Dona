import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

interface PrimaryButtonProps extends TouchableOpacityProps {
  children: string;
  full?: boolean;
}

// Pill CTA button — matches CLAUDE.md § PrimaryButton component
export function PrimaryButton({ children, full, style, disabled, ...rest }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      style={[styles.btn, full && styles.full, disabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={children}
      {...rest}
    >
      <Text style={styles.label}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  full:     { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  label: {
    color: Colors.light.onPrimary,
    fontSize: FontSize.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
