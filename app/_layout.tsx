import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useIsDark } from '@/hooks/useColors';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import * as Notif from 'expo-notifications';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useBehaviorStore } from '@/store/useBehaviorStore';
import { useSuggestionsStore } from '@/store/useSuggestionsStore';
import { supabase } from '@/lib/supabase';
import { buildDefaultDay } from '@/lib/optimizer';
import { scheduleAllNotifications } from '@/lib/notifications';
import { useProfileSync } from '@/hooks/useProfileSync';
import { clearSyncDirty } from '@/lib/syncGuard';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const router   = useRouter();
  const segments = useSegments();

  const isOnboarded = useUserStore((s) => s.isOnboarded);
  const { session, loading: authLoading, hydrating, setSession } = useAuthStore();

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
      const code      = queryParams?.code      as string | undefined;
      if (tokenHash && type === 'email') {
        await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      // onAuthStateChange fires → setSession → routing redirects automatically
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

    // If a different user logged in, reset ALL persisted stores before routing —
    // otherwise the previous user's activities/completions leak into the new
    // account (and get pushed to their Supabase rows by the first-sync logic)
    if (session) {
      const { userId, resetForUser } = useUserStore.getState();
      if (userId !== null && userId !== session.user.id) {
        resetForUser(session.user.id);
        useScheduleStore.getState().reset();
        useBehaviorStore.getState().reset();
        useSuggestionsStore.getState().reset();
        // The dirty flag belonged to the previous user's unsynced changes —
        // keeping it would push the freshly reset (empty) state over the new
        // user's remote data on hydration
        clearSyncDirty();
        return; // effect re-runs after reset
      }
      if (userId === null) {
        useUserStore.setState({ userId: session.user.id });
      }
    }

    const inAuth    = segments[0] === '(auth)';
    const inTabs    = segments[0] === '(tabs)';
    const inProfile = segments[0] === 'profile';
    const inChat    = segments[0] === 'chat';

    if (!session) {
      // Not logged in → login screen (verify-email stays visible while waiting for confirmation)
      const publicScreens = ['login', 'register', 'verify-email'];
      if (!inAuth || !publicScreens.includes(segments[1] ?? '')) {
        router.replace('/(auth)/login' as any);
      }
      return;
    }

    // While the remote profile is being restored, isOnboarded is the freshly
    // reset local value — routing on it would flash the onboarding welcome
    // screen. Stay put until hydration settles.
    if (hydrating) return;

    if (!isOnboarded) {
      // On verify-email with a session = just confirmed → go to welcome
      const awaitingScreens = ['login', 'register', 'verify-email'];
      const onAwaitingScreen = awaitingScreens.includes(segments[1] ?? '');
      if (!inAuth || onAwaitingScreen) router.replace('/(auth)/welcome');
      return;
    }

    // Logged in + onboarded → home (profile/chat/report screens are also valid destinations)
    const inReport = segments[0] === 'weekly-report';
    if (!inTabs && !inProfile && !inChat && !inReport) {
      const { sleep, meals, cycle } = useUserStore.getState();
      const events = (sleep.waketime && sleep.bedtime && sleep.prepMinutes != null)
        ? buildDefaultDay(
            { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
            meals,
          )
        : [];
      scheduleAllNotifications({
        events,
        cycleTracking:  cycle.tracking ?? false,
        lastPeriodDate: cycle.lastPeriodDate,
        cycleDays:      cycle.cycleDays,
        userActivities: useScheduleStore.getState().activities,
      });
      router.replace('/(tabs)/' as any);
    }
  }, [authLoading, storeHydrated, session, isOnboarded, segments, hydrating]);
}

export default function RootLayout() {
  const isDark = useIsDark();
  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_300Light,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });

  useProtectedRoute();
  useProfileSync();

  const router = useRouter();

  // Navigate to weekly report when user taps the Sunday evening notification
  useEffect(() => {
    const sub = Notif.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.identifier === 'dona-weekly-recap') {
        router.push('/weekly-report' as any);
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="chat" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="weekly-report" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
