import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, SleepSchedule, MealSchedule, SportInfo, WorkInfo, OtherActivityInfo, CycleInfo } from '../types';
import type { ThemePreference } from '@/hooks/useColors';

const INITIAL_STATE = {
  isOnboarded:     false,
  userId:          null as string | null,
  isPremium:       false, // server-managed via profiles.is_premium — read-only here
  themePreference: 'system' as ThemePreference,
  profile:       {} as Partial<UserProfile>,
  sleep:         { bedtime: '23:00', waketime: '07:00', prepMinutes: 40 } as Partial<SleepSchedule>,
  meals:         { entries: [{ time: '08:00', label: 'Petit-déjeuner' }, { time: '13:00', label: 'Déjeuner' }, { time: '19:30', label: 'Dîner' }] } as Partial<MealSchedule>,
  sport:         {} as Partial<SportInfo>,
  work:          {} as Partial<WorkInfo>,
  otherActivity: {} as Partial<OtherActivityInfo>,
  cycle:         { tracking: false, cycleDays: 28 } as Partial<CycleInfo>,
};

interface UserState {
  isOnboarded:     boolean;
  userId:          string | null;
  isPremium:       boolean;
  themePreference: ThemePreference;
  profile:       Partial<UserProfile>;
  sleep:         Partial<SleepSchedule>;
  meals:         Partial<MealSchedule>;
  sport:         Partial<SportInfo>;
  work:          Partial<WorkInfo>;
  otherActivity: Partial<OtherActivityInfo>;
  cycle:         Partial<CycleInfo>;

  setTheme:         (pref: ThemePreference)            => void;
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

      setTheme:         (pref) => set({ themePreference: pref }),
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
