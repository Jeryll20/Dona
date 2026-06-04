import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TimelineEvent, UserActivity, ActivityOverride, CustomCategory } from '../types';

export type ViewMode = 'day' | 'week' | 'month';

interface ScheduleState {
  todayEvents:      TimelineEvent[];
  activities:       UserActivity[];
  overrides:        ActivityOverride[];
  customCategories: CustomCategory[];
  viewMode:         ViewMode;
  dayOffset:        number;

  setTodayEvents:      (events: TimelineEvent[])                  => void;
  addActivity:         (activity: UserActivity)                    => void;
  removeActivity:      (id: string)                               => void;
  updateActivity:      (id: string, patch: Partial<UserActivity>) => void;
  setOverride:         (override: ActivityOverride)                => void;
  removeOverride:      (activityId: string, date: string)         => void;
  setViewMode:         (mode: ViewMode)                           => void;
  setDayOffset:        (offset: number | ((prev: number) => number)) => void;
  addCustomCategory:   (cat: CustomCategory)                      => void;
  updateCustomCategory:(id: string, patch: Partial<CustomCategory>) => void;
  removeCustomCategory:(id: string)                               => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      todayEvents:      [],
      activities:       [],
      overrides:        [],
      customCategories: [],
      viewMode:         'day',
      dayOffset:        0,

      setTodayEvents: (events) => set({ todayEvents: events }),
      setViewMode:    (mode)   => set({ viewMode: mode }),
      setDayOffset:   (offset) => set((s) => ({
        dayOffset: typeof offset === 'function' ? offset(s.dayOffset) : offset,
      })),

      addActivity: (activity) =>
        set((s) => ({ activities: [activity, ...s.activities] })),

      removeActivity: (id) =>
        set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),

      updateActivity: (id, patch) =>
        set((s) => ({
          activities: s.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      setOverride: (override) =>
        set((s) => ({
          overrides: [
            ...s.overrides.filter(
              (o) => !(o.activityId === override.activityId && o.date === override.date)
            ),
            override,
          ],
        })),

      removeOverride: (activityId, date) =>
        set((s) => ({
          overrides: s.overrides.filter(
            (o) => !(o.activityId === activityId && o.date === date)
          ),
        })),

      addCustomCategory: (cat) =>
        set((s) => ({ customCategories: [...s.customCategories, cat] })),

      updateCustomCategory: (id, patch) =>
        set((s) => ({
          customCategories: s.customCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCustomCategory: (id) =>
        set((s) => ({
          customCategories: s.customCategories.filter((c) => c.id !== id),
          // Remove reference from activities that used this category
          activities: s.activities.map((a) =>
            a.customCatId === id ? { ...a, customCatId: undefined } : a,
          ),
        })),
    }),
    {
      name:    'dona-schedule',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        activities:       s.activities,
        overrides:        s.overrides,
        customCategories: s.customCategories,
      }),
    }
  )
);
