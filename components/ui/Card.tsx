import { StyleSheet, View, ViewProps } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Radius, Shadow } from '@/constants/spacing';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

// Surface card container — matches CLAUDE.md § Card component
export function Card({ children, style, ...rest }: CardProps) {
  const C = useColors();
  const s = makeStyles(C);

  return (
    <View style={[s.card, style]} {...rest}>
      {children}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      ...Shadow.sm,
    },
  });
}
