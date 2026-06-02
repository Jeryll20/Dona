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

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),

  signOut: async () => {
    await supabase.auth.signOut();
    useUserStore.getState().reset();
    set({ session: null });
  },
}));
