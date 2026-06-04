import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface EyebrowProps {
  children: string;
  icon?: IoniconsName;
}

// Small pill label with optional icon — matches CLAUDE.md § Eyebrow component
export function Eyebrow({ children, icon }: EyebrowProps) {
  const C = useColors();
  const s = makeStyles(C);

  return (
    <View style={s.pill}>
      {icon && (
        <Ionicons name={icon} size={13} color={C.primaryStrong} />
      )}
      <Text style={s.text}>{children}</Text>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      alignSelf: 'flex-start',
      backgroundColor: C.primaryTint,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
    },
    text: {
      fontSize: FontSize.xs,
      fontWeight: '700',
      color: C.primaryStrong,
      letterSpacing: 0.3,
    },
  });
}
