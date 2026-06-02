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
import * as Linking from 'expo-linking';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { buildDefaultDay } from '@/lib/optimizer';
import { scheduleAllNotifications } from '@/lib/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const router   = useRouter();
  const segments = useSegments();

  const isOnboarded    = useUserStore((s) => s.isOnboarded);
  const sleep          = useUserStore((s) => s.sleep);
  const setTodayEvents = useScheduleStore((s) => s.setTodayEvents);
  const { session, loading: authLoading, setSession } = useAuthStore();

  const [storeHydrated, setStoreHydrated] = useState(false);

  // Listen to Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Handle deep link email confirmation (dona://auth/callback?token_hash=...&type=email)
  useEffect(() => {
    async function handleUrl(url: string) {
      const { queryParams } = Linking.parse(url);
      const tokenHash = queryParams?.token_hash as string | undefined;
      const type      = queryParams?.type      as string | undefined;
      if (tokenHash && type === 'email') {
        await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
        // onAuthStateChange fires → setSession → routing redirects automatically
      }
    }

    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));
    return () => sub.remove();
  }, []);

  // Wait for Zustand persistence hydration
  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setStoreHydrated(true));
    if (useUserStore.persist.hasHydrated()) setStoreHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (authLoading || !storeHydrated) return;

    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    if (!session) {
      // Not logged in → login screen
      if (!inAuth || (segments[1] !== 'login' && segments[1] !== 'register')) {
        router.replace('/(auth)/login' as any);
      }
      return;
    }

    if (!isOnboarded) {
      // On verify-email with a session = just confirmed → go to welcome
      const awaitingScreens = ['login', 'register', 'verify-email'];
      const onAwaitingScreen = awaitingScreens.includes(segments[1] ?? '');
      if (!inAuth || onAwaitingScreen) router.replace('/(auth)/welcome');
      return;
    }

    // Logged in + onboarded → home
    if (!inTabs) {
      const events = (sleep.waketime && sleep.bedtime && sleep.prepMinutes != null)
        ? buildDefaultDay({ bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes })
        : [];
      if (events.length) setTodayEvents(events);

      const cycle = useUserStore.getState().cycle;
      scheduleAllNotifications({
        events,
        cycleTracking:  cycle.tracking ?? false,
        lastPeriodDate: cycle.lastPeriodDate,
        cycleDays:      cycle.cycleDays,
      });

      router.replace('/(tabs)/' as any);
    }
  }, [authLoading, storeHydrated, session, isOnboarded, segments]);
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
        <Stack.Screen name="chat" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
