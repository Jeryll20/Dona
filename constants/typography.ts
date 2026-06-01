export const FontFamily = {
  heading: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  mono: 'JetBrainsMono_400Regular',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 26,
  '3xl': 30,
  '4xl': 36,
} as const;

export const LineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
} as const;
