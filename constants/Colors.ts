// Design system colors — exact OKLCH→hex conversion from Dona.html prototype
// Source of truth: CLAUDE.md § Color Palette

const palette = {
  // Canvas / backgrounds
  background:   '#F5F3FB',
  backgroundAlt: '#EEEBf7',
  surface:      '#FFFFFF',
  surfaceSunk:  '#F2EFF9',

  // Ink / text hierarchy
  ink:      '#332B45',
  ink2:     '#5E5470',
  ink3:     '#8B83A0',
  hairline: '#E4E0EF',

  // Primary — periwinkle violet
  primary:      '#7C6FCD',
  primaryStrong: '#6254B8',
  primaryTint:  '#EDE9FA',
  primaryTint2: '#DDD6F5',
  onPrimary:    '#FEFEFE',

  // Category tints — sommeil
  sleepBg:  '#DDD9F2',
  sleepInk: '#5A52A0',

  // Category tints — travail
  workBg:  '#DBD9F5',
  workInk: '#524FB5',

  // Category tints — sport
  sportBg:  '#F5E0DA',
  sportInk: '#C0533A',

  // Category tints — activité (générique : culture, loisirs…)
  activityBg:  '#DBEAFE',
  activityInk: '#1D4ED8',

  // Category tints — trajet
  transitBg:  '#EAE7F2',
  transitInk: '#7A7290',

  // Category tints — repas
  mealBg:  '#DCF2E3',
  mealInk: '#3A8A50',

  // Semantic
  error:   '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // Danger (destructive actions — oklch(0.55 0.2 20) / oklch(0.95 0.04 20))
  danger:     '#DC2626',
  dangerTint: '#FEE2E2',
} as const;

export const Colors = {
  light: {
    ...palette,
    tabIconDefault:  palette.ink3,
    tabIconSelected: palette.primaryStrong,
  },
  dark: {
    ...palette,
    background:   '#1A1820',
    backgroundAlt: '#221F2E',
    surface:      '#2C2840',
    surfaceSunk:  '#221F2E',
    ink:          '#F0EEF8',
    ink2:         '#B8B4CC',
    ink3:         '#7A7690',
    hairline:     '#3A3650',
    primary:       '#9C8FE8',
    primaryStrong: '#A89EFF',
    primaryTint:   '#332D52',
    primaryTint2:  '#443D6B',
    tabIconDefault:  '#7A7690',
    tabIconSelected: '#A89EFF',
  },
} as const;

export type ColorScheme = 'light' | 'dark';

export const COLOR_PALETTE: { bg: string; ink: string; label: string }[] = [
  { bg: '#DBD9F5', ink: '#524FB5', label: 'Violet'  },
  { bg: '#F5E0DA', ink: '#C0533A', label: 'Corail'  },
  { bg: '#DCF2E3', ink: '#3A8A50', label: 'Vert'    },
  { bg: '#DDD9F2', ink: '#5A52A0', label: 'Lavande' },
  { bg: '#EAE7F2', ink: '#7A7290', label: 'Gris'    },
  { bg: '#FEF3C7', ink: '#92400E', label: 'Ambre'   },
  { bg: '#CCFBF1', ink: '#0F766E', label: 'Teal'    },
  { bg: '#FCE7F3', ink: '#9D174D', label: 'Rose'    },
  { bg: '#DBEAFE', ink: '#1D4ED8', label: 'Bleu'    },
];
