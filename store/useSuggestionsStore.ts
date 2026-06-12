import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Suggestion } from '../types';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface SuggestionsState {
  suggestions: Suggestion[];
  // Titles accepted/dismissed today — excluded from regeneration so they
  // don't reappear when the schedule changes. Resets each day.
  consumedTitles: string[];
  consumedDate: string;
  // "Je n'aime pas" — plan/suggestion titles banned forever (device-local)
  dislikedTitles: string[];

  setSuggestions: (suggestions: Suggestion[]) => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  dislikeTitle: (title: string) => void;
  reset: () => void;
}

function consume(s: SuggestionsState, id: string, flag: 'accepted' | 'dismissed') {
  const target = s.suggestions.find((sg) => sg.id === id);
  const today  = todayISO();
  const base   = s.consumedDate === today ? s.consumedTitles : [];
  return {
    suggestions: s.suggestions.map((sg) =>
      sg.id === id
        ? { ...sg, accepted: flag === 'accepted', dismissed: flag === 'dismissed' }
        : sg
    ),
    consumedTitles: target && !base.includes(target.title) ? [...base, target.title] : base,
    consumedDate: today,
  };
}

export const useSuggestionsStore = create<SuggestionsState>()(
  persist(
    (set) => ({
      suggestions: [],
      consumedTitles: [],
      consumedDate: '',
      dislikedTitles: [],

      setSuggestions: (suggestions) =>
        set({ suggestions }),

      acceptSuggestion: (id) =>
        set((s) => consume(s, id, 'accepted')),

      dismissSuggestion: (id) =>
        set((s) => consume(s, id, 'dismissed')),

      dislikeTitle: (title) =>
        set((s) => ({
          dislikedTitles: s.dislikedTitles.includes(title)
            ? s.dislikedTitles
            : [...s.dislikedTitles, title],
        })),

      reset: () =>
        set({ suggestions: [], consumedTitles: [], consumedDate: '', dislikedTitles: [] }),
    }),
    {
      name:    'dona-suggestions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
