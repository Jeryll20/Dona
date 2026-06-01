import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  HankenGrotesk_300Light,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import 'react-native-reanimated';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { buildDefaultDay } from '@/lib/optimizer';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const router   = useRouter();
  const segments = useSegments();
  const isOnboarded  = useUserStore((s) => s.isOnboarded);
  const sleep        = useUserStore((s) => s.sleep);
  const setTodayEvents = useScheduleStore((s) => s.setTodayEvents);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    if (useUserStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const inAuth = segments[0] === '(auth)';

    if (isOnboarded && inAuth) {
      // Rebuild today's events from persisted profile
      if (sleep.waketime && sleep.bedtime && sleep.prepMinutes != null) {
        setTodayEvents(buildDefaultDay({
          bedtime:     sleep.bedtime,
          waketime:    sleep.waketime,
          prepMinutes: sleep.prepMinutes,
        }));
      }
      router.replace('/(tabs)');
    } else if (!isOnboarded && !inAuth) {
      router.replace('/(auth)/welcome');
    }
  }, [hydrated, isOnboarded, segments]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_300Light,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });

  useProtectedRoute();

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}
