import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { fetchAndHydrateProfile, pushProfile } from '@/lib/profileSync';
import { fetchAndHydrateActivities, pushAllActivities } from '@/lib/activitiesSync';
import { fetchAndHydrateCompletions, pushAllCompletions } from '@/lib/completionsSync';
import { fetchAndHydrateCustomCats, pushAllCustomCats } from '@/lib/customCatsSync';
import { isSyncDirty, clearSyncDirty } from '@/lib/syncGuard';

export function useProfileSync() {
  const session    = useAuthStore((s) => s.session);
  const userId     = session?.user?.id;
  const hydrating  = useRef(false);
  const debounce   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On login: if a previous mutation failed (offline…), local state is newer —
  // push it instead of letting remote-wins hydration overwrite it.
  // Otherwise: fetch remote profile + activities + completions.
  useEffect(() => {
    if (!userId) return;
    hydrating.current = true;
    useAuthStore.getState().setHydrating(true);
    (async () => {
      if (await isSyncDirty()) {
        const results = await Promise.all([
          pushProfile(userId),
          pushAllActivities(userId),
          pushAllCompletions(userId),
          pushAllCustomCats(userId),
        ]);
        if (results.every(Boolean)) await clearSyncDirty();
      } else {
        await Promise.all([
          fetchAndHydrateProfile(userId),
          fetchAndHydrateActivities(userId),
          fetchAndHydrateCompletions(userId),
          fetchAndHydrateCustomCats(userId),
        ]);
      }
    })().finally(() => {
      hydrating.current = false;
      useAuthStore.getState().setHydrating(false);
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
