import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

interface PrimaryButtonProps extends TouchableOpacityProps {
  children: string;
  full?: boolean;
}

// Pill CTA button — matches CLAUDE.md § PrimaryButton component
export function PrimaryButton({ children, full, style, disabled, ...rest }: PrimaryButtonProps) {
  const C = useColors();
  const s = makeStyles(C);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      style={[s.btn, full && s.full, disabled && s.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={children}
      {...rest}
    >
      <Text style={s.label}>{children}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    btn: {
      backgroundColor: C.primary,
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
      color: C.onPrimary,
      fontSize: FontSize.base,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
  });
}
