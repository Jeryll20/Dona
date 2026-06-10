import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivityCompletion, WeeklyReport } from '@/types';

interface BehaviorState {
  completions:  ActivityCompletion[];
  weeklyReport: WeeklyReport | null;

  setCompletion:    (c: ActivityCompletion) => void;
  removeCompletion: (activityId: string, date: string) => void;
  setWeeklyReport:  (report: WeeklyReport) => void;
  clearReport:      () => void;
  reset:            () => void;
}

export const useBehaviorStore = create<BehaviorState>()(
  persist(
    (set) => ({
      completions:  [],
      weeklyReport: null,

      setCompletion: (c) =>
        set((s) => ({
          completions: [
            ...s.completions.filter(
              (x) => !(x.activityId === c.activityId && x.date === c.date),
            ),
            c,
          ],
        })),

      removeCompletion: (activityId, date) =>
        set((s) => ({
          completions: s.completions.filter(
            (x) => !(x.activityId === activityId && x.date === date),
          ),
        })),

      setWeeklyReport: (report) => set({ weeklyReport: report }),
      clearReport:     ()       => set({ weeklyReport: null }),
      reset:           ()       => set({ completions: [], weeklyReport: null }),
    }),
    {
      name:    'dona-behavior',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
