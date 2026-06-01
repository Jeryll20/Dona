// Timeline category map — matches CLAUDE.md § Timeline — Activity Categories & Data Model
import { Colors } from './Colors';

export type CatKey = 'sommeil' | 'prep' | 'travail' | 'activite' | 'trajet' | 'repas';

export const CAT: Record<CatKey, { bg: string; ink: string; icon: string }> = {
  sommeil:  { bg: Colors.light.sleepBg,    ink: Colors.light.sleepInk,    icon: 'moon' },
  prep:     { bg: Colors.light.mealBg,     ink: Colors.light.mealInk,     icon: 'spark' },
  travail:  { bg: Colors.light.workBg,     ink: Colors.light.workInk,     icon: 'list' },
  activite: { bg: Colors.light.activityBg, ink: Colors.light.activityInk, icon: 'run' },
  trajet:   { bg: Colors.light.transitBg,  ink: Colors.light.transitInk,  icon: 'car' },
  repas:    { bg: Colors.light.mealBg,     ink: Colors.light.mealInk,     icon: 'fork' },
};
