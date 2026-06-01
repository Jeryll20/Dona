import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius, Shadow } from '@/constants/spacing';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

// Surface card container — matches CLAUDE.md § Card component
export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    ...Shadow.sm,
  },
});
