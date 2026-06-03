import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, SleepSchedule, MealSchedule, SportInfo, WorkInfo, OtherActivityInfo, CycleInfo } from '../types';

const INITIAL_STATE = {
  isOnboarded: false,
  userId:      null as string | null,
  profile:       {} as Partial<UserProfile>,
  sleep:         { bedtime: '23:00', waketime: '07:00', prepMinutes: 40 } as Partial<SleepSchedule>,
  meals:         { entries: [{ time: '08:00', label: 'Petit-déjeuner' }, { time: '13:00', label: 'Déjeuner' }, { time: '19:30', label: 'Dîner' }] } as Partial<MealSchedule>,
  sport:         { active: false, interested: false } as Partial<SportInfo>,
  work:          { employed: false, interested: false } as Partial<WorkInfo>,
  otherActivity: { active: false, interested: false } as Partial<OtherActivityInfo>,
  cycle:         { tracking: false, cycleDays: 28 } as Partial<CycleInfo>,
};

interface UserState {
  isOnboarded: boolean;
  userId:      string | null;
  profile:       Partial<UserProfile>;
  sleep:         Partial<SleepSchedule>;
  meals:         Partial<MealSchedule>;
  sport:         Partial<SportInfo>;
  work:          Partial<WorkInfo>;
  otherActivity: Partial<OtherActivityInfo>;
  cycle:         Partial<CycleInfo>;

  setProfile:       (data: Partial<UserProfile>)       => void;
  setSleep:         (data: Partial<SleepSchedule>)     => void;
  setMeals:         (data: Partial<MealSchedule>)      => void;
  setSport:         (data: Partial<SportInfo>)         => void;
  setWork:          (data: Partial<WorkInfo>)          => void;
  setOtherActivity: (data: Partial<OtherActivityInfo>) => void;
  setCycle:         (data: Partial<CycleInfo>)         => void;
  completeOnboarding:  () => void;
  resetForUser:        (userId: string) => void;
  reset:               () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setProfile:       (data) => set((s) => ({ profile:       { ...s.profile,       ...data } })),
      setSleep:         (data) => set((s) => ({ sleep:         { ...s.sleep,         ...data } })),
      setMeals:         (data) => set((s) => ({ meals:         { ...s.meals,         ...data } })),
      setSport:         (data) => set((s) => ({ sport:         { ...s.sport,         ...data } })),
      setWork:          (data) => set((s) => ({ work:          { ...s.work,          ...data } })),
      setOtherActivity: (data) => set((s) => ({ otherActivity: { ...s.otherActivity, ...data } })),
      setCycle:         (data) => set((s) => ({ cycle:         { ...s.cycle,         ...data } })),
      completeOnboarding: () => set({ isOnboarded: true }),

      resetForUser: (userId) => set({ ...INITIAL_STATE, userId }),
      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name:    'dona-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
