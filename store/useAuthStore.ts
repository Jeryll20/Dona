import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserStore } from './useUserStore';

interface AuthState {
  session:    Session | null;
  loading:    boolean;
  // True while the post-login remote fetch is restoring the stores — routing
  // must wait for it, otherwise the freshly reset isOnboarded=false flashes
  // the onboarding welcome screen before the real value arrives
  hydrating:  boolean;
  setSession: (session: Session | null) => void;
  setHydrating: (hydrating: boolean) => void;
  signOut:    () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  hydrating: false,

  setSession: (session) => set({ session, loading: false }),
  setHydrating: (hydrating) => set({ hydrating }),

  signOut: async () => {
    await supabase.auth.signOut();
    useUserStore.getState().reset();
    set({ session: null });
  },
}));
