// Design system colors — periwinkle-violet palette (approved in design handoff)
// Converted from oklch values in the approved Dona prototype

const palette = {
  // Canvas / backgrounds
  background: '#F7F6FB',
  backgroundAlt: '#F0EEF7',
  surface: '#FFFFFF',
  surfaceSunk: '#F2F0F7',

  // Ink / text hierarchy
  ink: '#2D293D',
  ink2: '#5A5669',
  ink3: '#8B8799',
  hairline: '#E2DEF0',

  // Primary — periwinkle-violet
  primary: '#7B6CF6',
  primaryStrong: '#6356D5',
  primaryTint: '#EEE9FF',
  primaryTint2: '#DDD5FF',
  onPrimary: '#FFFFFF',

  // Category tints (muted, low-chroma — keeps timeline serene)
  sleepBg: '#DBD7F0',
  sleepInk: '#4B4695',
  workBg: '#DDD8F5',
  workInk: '#4E44A0',
  activityBg: '#F7DDD7',
  activityInk: '#9E4D44',
  transitBg: '#ECEAF4',
  transitInk: '#706B7D',
  mealBg: '#DAF0E2',
  mealInk: '#3A7850',

  // Semantic
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
} as const;

export const Colors = {
  light: {
    ...palette,
    tabBar: palette.surface,
    tabIconDefault: palette.ink3,
    tabIconSelected: palette.primaryStrong,
  },
  dark: {
    ...palette,
    background: '#1A1820',
    backgroundAlt: '#221F2E',
    surface: '#2C2840',
    surfaceSunk: '#221F2E',
    ink: '#F0EEF8',
    ink2: '#B8B4CC',
    ink3: '#7A7690',
    hairline: '#3A3650',
    tabBar: '#221F2E',
    tabIconDefault: '#7A7690',
    tabIconSelected: '#A89EFF',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
