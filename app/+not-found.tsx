import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/spacing';

export default function NotFoundScreen() {
  const C = useColors();
  const s = makeStyles(C);
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View style={s.container}>
        <Text style={s.title}>Cette page n'existe pas.</Text>
        <Link href={'/(tabs)/' as any} style={s.link}>
          <Text style={s.linkText}>Retour à l'accueil</Text>
        </Link>
      </View>
    </>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
      backgroundColor: C.background,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: C.ink,
    },
    link: {
      marginTop: Spacing.base,
      paddingVertical: Spacing.md,
    },
    linkText: {
      fontSize: 14,
      color: C.primary,
    },
  });
}
