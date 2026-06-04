import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { fetchAndHydrateProfile, pushProfile } from '@/lib/profileSync';
import { fetchAndHydrateActivities } from '@/lib/activitiesSync';
import { fetchAndHydrateCompletions } from '@/lib/completionsSync';

export function useProfileSync() {
  const session    = useAuthStore((s) => s.session);
  const userId     = session?.user?.id;
  const hydrating  = useRef(false);
  const debounce   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On login: fetch remote profile + activities + completions
  useEffect(() => {
    if (!userId) return;
    hydrating.current = true;
    Promise.all([
      fetchAndHydrateProfile(userId),
      fetchAndHydrateActivities(userId),
      fetchAndHydrateCompletions(userId),
    ]).finally(() => {
      hydrating.current = false;
    });
  }, [userId]);

  // On any profile store change: push to Supabase (debounced 2s, skip during hydration)
  useEffect(() => {
    if (!userId) return;

    const unsub = useUserStore.subscribe(() => {
      if (hydrating.current) return;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => pushProfile(userId), 2000);
    });

    return () => {
      unsub();
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [userId]);
}
