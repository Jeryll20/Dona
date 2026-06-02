import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserStore } from './useUserStore';

interface AuthState {
  session:    Session | null;
  loading:    boolean;
  setSession: (session: Session | null) => void;
  signOut:    () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: true,

  setSession: (session) => {
    const prev = get().session;
    const prevId = prev?.user?.id;
    const nextId = session?.user?.id;

    // Different user logged in → reset profile data
    if (session && nextId !== prevId) {
      const { userId, resetForUser } = useUserStore.getState();
      if (userId && userId !== nextId) {
        resetForUser(nextId!);
      } else if (!userId) {
        // First login on this device — bind the current stored data to this user
        useUserStore.setState({ userId: nextId ?? null });
      }
    }

    set({ session, loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    useUserStore.getState().reset();
    set({ session: null });
  },
}));
