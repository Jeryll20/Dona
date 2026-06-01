// 4px base grid
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
  '5xl': 72,
} as const;

// Matches CLAUDE.md: --r-card=24, --r-block=18, --r-input=14, --r-pill=999
export const Radius = {
  sm:    8,
  input: 14,
  block: 18,
  card:  24,
  pill:  999,
} as const;

// React Native single-shadow approximations of the CLAUDE.md multi-shadow spec
// shadowColor = #2E2048 (dark violet) matches rgba(46,32,72,...)
export const Shadow = {
  sm: {
    shadowColor: '#2E2048',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },
  md: {
    shadowColor: '#2E2048',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  lift: {
    shadowColor: '#2E2048',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 15,
    elevation: 8,
  },
} as const;
