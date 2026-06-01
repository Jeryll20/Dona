// Hanken Grotesk — matches CLAUDE.md § Typography
export const FontFamily = {
  light:     'HankenGrotesk_300Light',
  regular:   'HankenGrotesk_400Regular',
  medium:    'HankenGrotesk_500Medium',
  semiBold:  'HankenGrotesk_600SemiBold',
  bold:      'HankenGrotesk_700Bold',
  extraBold: 'HankenGrotesk_800ExtraBold',
} as const;

// px sizes — matches CLAUDE.md type scale
export const FontSize = {
  xs:   11,   // timeline hour labels, tab labels
  sm:   13,   // caption / sub
  md:   15,   // body text
  base: 16,   // body text / card titles
  lg:   18,   // card titles upper range
  xl:   22,   // section titles lower
  '2xl': 26,  // section titles upper
  '3xl': 30,  // screen title h1
  '4xl': 36,  // onboarding title large
} as const;

export const LineHeight = {
  tight:   1.1,
  snug:    1.25,
  normal:  1.5,
  relaxed: 1.65,
} as const;

export const LetterSpacing = {
  tight:  -0.5,
  normal:  0,
  wide:    0.3,
  wider:   0.6,
} as const;
