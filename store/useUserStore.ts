import { create } from 'zustand';
import type { OnboardingData, UserProfile, SleepSchedule, MealSchedule, SportInfo, WorkInfo, CycleInfo } from '../types';

interface UserState {
  isOnboarded: boolean;
  profile: Partial<UserProfile>;
  sleep: Partial<SleepSchedule>;
  meals: Partial<MealSchedule>;
  sport: Partial<SportInfo>;
  work: Partial<WorkInfo>;
  otherActivities: Partial<SportInfo>[];
  cycle: Partial<CycleInfo>;

  setProfile: (data: Partial<UserProfile>) => void;
  setSleep: (data: Partial<SleepSchedule>) => void;
  setMeals: (data: Partial<MealSchedule>) => void;
  setSport: (data: Partial<SportInfo>) => void;
  setWork: (data: Partial<WorkInfo>) => void;
  setOtherActivities: (data: Partial<SportInfo>[]) => void;
  setCycle: (data: Partial<CycleInfo>) => void;
  completeOnboarding: () => void;
  getOnboardingData: () => OnboardingData;
}

export const useUserStore = create<UserState>((set, get) => ({
  isOnboarded: false,
  profile: {},
  sleep: { prepMinutes: 30 },
  meals: { times: ['08:00', '12:30', '19:30'] },
  sport: { active: false, interested: false },
  work: { employed: false, interested: false },
  otherActivities: [],
  cycle: { tracking: false, cycleDays: 28 },

  setProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
  setSleep: (data) => set((s) => ({ sleep: { ...s.sleep, ...data } })),
  setMeals: (data) => set((s) => ({ meals: { ...s.meals, ...data } })),
  setSport: (data) => set((s) => ({ sport: { ...s.sport, ...data } })),
  setWork: (data) => set((s) => ({ work: { ...s.work, ...data } })),
  setOtherActivities: (data) => set({ otherActivities: data }),
  setCycle: (data) => set((s) => ({ cycle: { ...s.cycle, ...data } })),
  completeOnboarding: () => set({ isOnboarded: true }),

  getOnboardingData: (): OnboardingData => {
    const s = get();
    return {
      profile: s.profile,
      sleep: s.sleep,
      meals: s.meals,
      sport: s.sport,
      work: s.work,
      otherActivities: s.otherActivities,
      cycle: s.cycle,
    };
  },
}));
