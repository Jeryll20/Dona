import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TimelineEvent, UserActivity } from '../types';

interface ScheduleState {
  todayEvents: TimelineEvent[];
  activities:  UserActivity[];

  setTodayEvents:  (events: TimelineEvent[])               => void;
  addActivity:     (activity: UserActivity)                 => void;
  removeActivity:  (id: string)                            => void;
  updateActivity:  (id: string, patch: Partial<UserActivity>) => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      todayEvents: [],
      activities:  [],

      setTodayEvents: (events) => set({ todayEvents: events }),

      addActivity: (activity) =>
        set((s) => ({ activities: [activity, ...s.activities] })),

      removeActivity: (id) =>
        set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),

      updateActivity: (id, patch) =>
        set((s) => ({
          activities: s.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
    }),
    {
      name:    'dona-schedule',
      storage: createJSONStorage(() => AsyncStorage),
      // todayEvents sont recalculés à chaque ouverture — pas besoin de les persister
      partialize: (s) => ({ activities: s.activities }),
    }
  )
);
