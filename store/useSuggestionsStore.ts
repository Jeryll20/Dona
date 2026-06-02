import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Suggestion } from '../types';

interface SuggestionsState {
  suggestions: Suggestion[];
  lastGeneratedAt?: string;

  setSuggestions: (suggestions: Suggestion[]) => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
}

export const useSuggestionsStore = create<SuggestionsState>()(
  persist(
    (set) => ({
      suggestions: [],
      lastGeneratedAt: undefined,

      setSuggestions: (suggestions) =>
        set({ suggestions, lastGeneratedAt: new Date().toISOString() }),

      acceptSuggestion: (id) =>
        set((s) => ({
          suggestions: s.suggestions.map((sg) =>
            sg.id === id ? { ...sg, accepted: true, dismissed: false } : sg
          ),
        })),

      dismissSuggestion: (id) =>
        set((s) => ({
          suggestions: s.suggestions.map((sg) =>
            sg.id === id ? { ...sg, dismissed: true, accepted: false } : sg
          ),
        })),
    }),
    {
      name:    'dona-suggestions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
