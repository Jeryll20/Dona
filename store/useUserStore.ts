import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, SleepSchedule, MealSchedule, SportInfo, WorkInfo, CycleInfo } from '../types';

interface UserState {
  isOnboarded: boolean;
  profile: Partial<UserProfile>;
  sleep: Partial<SleepSchedule>;
  meals: Partial<MealSchedule>;
  sport: Partial<SportInfo>;
  work: Partial<WorkInfo>;
  cycle: Partial<CycleInfo>;

  setProfile:          (data: Partial<UserProfile>)    => void;
  setSleep:            (data: Partial<SleepSchedule>)  => void;
  setMeals:            (data: Partial<MealSchedule>)   => void;
  setSport:            (data: Partial<SportInfo>)      => void;
  setWork:             (data: Partial<WorkInfo>)       => void;
  setCycle:            (data: Partial<CycleInfo>)      => void;
  completeOnboarding:  () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      profile: {},
      sleep:   { bedtime: '23:00', waketime: '07:00', sleepHours: 8, prepMinutes: 40 },
      meals:   { times: ['08:00', '13:00', '19:30'] },
      sport:   { active: false, interested: false },
      work:    { employed: false, interested: false },
      cycle:   { tracking: false, cycleDays: 28 },

      setProfile:  (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
      setSleep:    (data) => set((s) => ({ sleep:   { ...s.sleep,   ...data } })),
      setMeals:    (data) => set((s) => ({ meals:   { ...s.meals,   ...data } })),
      setSport:    (data) => set((s) => ({ sport:   { ...s.sport,   ...data } })),
      setWork:     (data) => set((s) => ({ work:    { ...s.work,    ...data } })),
      setCycle:    (data) => set((s) => ({ cycle:   { ...s.cycle,   ...data } })),
      completeOnboarding: () => set({ isOnboarded: true }),
    }),
    {
      name:    'dona-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
