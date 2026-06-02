import type { CyclePhase } from '@/types';

// ── Phase metadata ─────────────────────────────────────────────────────────────

export interface PhaseAdvice {
  sport:     string;
  nutrition: string;
  mood:      string;
  rest:      string;
}

export interface PhaseInfo {
  key:         CyclePhase;
  label:       string;
  description: string;
  bg:          string;
  ink:         string;
  dayRange:    string;
  advice:      PhaseAdvice;
}

export const PHASES: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    key:         'menstrual',
    label:       'Menstruelle',
    description: 'Ton corps se repose. Écoute tes besoins.',
    bg:          '#F5E0DA',
    ink:         '#C0533A',
    dayRange:    'Jours 1–5',
    advice: {
      sport:     'Yoga doux, marche légère, étirements',
      nutrition: 'Aliments riches en fer · légumes chauds · infusions',
      mood:      "C'est normal d'avoir moins d'énergie — sois indulgente",
      rest:      'Micro-siestes et couchers tôt bienvenus',
    },
  },
  follicular: {
    key:         'follicular',
    label:       'Folliculaire',
    description: 'Ton énergie remonte. Profites-en !',
    bg:          '#DDD9F2',
    ink:         '#5A52A0',
    dayRange:    'Jours 6–13',
    advice: {
      sport:     'Cardio, musculation, activités intenses',
      nutrition: 'Protéines · légumes verts · hydratation',
      mood:      'Motivation et créativité au maximum — lance tes projets',
      rest:      'Idéal pour les tâches exigeantes et les défis',
    },
  },
  ovulation: {
    key:         'ovulation',
    label:       'Ovulation',
    description: "Phase de pic d'énergie et de sociabilité.",
    bg:          '#DBD9F5',
    ink:         '#524FB5',
    dayRange:    'Jours 14–16',
    advice: {
      sport:     'HIIT, sport collectif, défi physique',
      nutrition: 'Fibres · antioxydants · fruits frais',
      mood:      'Confiance et communication au maximum',
      rest:      'Profite de tes relations sociales',
    },
  },
  luteal: {
    key:         'luteal',
    label:       'Lutéale',
    description: 'Ton corps prépare le cycle suivant.',
    bg:          '#DCF2E3',
    ink:         '#3A8A50',
    dayRange:    'Jours 17–28',
    advice: {
      sport:     'Pilates, natation, yoga, marche',
      nutrition: 'Magnésium · glucides complexes · chocolat noir',
      mood:      'Sois indulgente avec toi-même — les émotions fluctuent',
      rest:      'Favorise calme, routine et couchers réguliers',
    },
  },
};

// ── Calcul de la phase ─────────────────────────────────────────────────────────

export function getCyclePhase(lastPeriodDate: string, cycleDays: number): CyclePhase {
  const elapsed = daysSince(lastPeriodDate) % cycleDays;
  if (elapsed <= 5)  return 'menstrual';
  if (elapsed <= 13) return 'follicular';
  if (elapsed <= 16) return 'ovulation';
  return 'luteal';
}

// ── Statut complet ─────────────────────────────────────────────────────────────

export interface CycleStatus {
  phase:               CyclePhase;
  dayInCycle:          number;   // 1-based
  daysUntilNextPhase:  number;
  daysUntilPeriod:     number;
  nextPeriodDate:      Date;
  phaseInfo:           PhaseInfo;
}

export function getCycleStatus(lastPeriodDate: string, cycleDays: number): CycleStatus {
  const elapsed         = daysSince(lastPeriodDate) % cycleDays;
  const dayInCycle      = elapsed + 1;
  const phase           = getCyclePhase(lastPeriodDate, cycleDays);
  const phaseInfo       = PHASES[phase];

  // Jours restants dans la phase courante
  const phaseEnds: Record<CyclePhase, number> = {
    menstrual:  5,
    follicular: 13,
    ovulation:  16,
    luteal:     cycleDays,
  };
  const daysUntilNextPhase = Math.max(0, phaseEnds[phase] - elapsed);

  // Jours jusqu'aux prochaines règles
  const daysUntilPeriod = cycleDays - elapsed;
  const nextPeriodDate  = new Date();
  nextPeriodDate.setDate(nextPeriodDate.getDate() + daysUntilPeriod);

  return { phase, dayInCycle, daysUntilNextPhase, daysUntilPeriod, nextPeriodDate, phaseInfo };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  const past  = new Date(isoDate);
  const today = new Date();
  past.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - past.getTime()) / 86_400_000);
}

export function getPhaseInfo(phase: CyclePhase): PhaseInfo {
  return PHASES[phase];
}

// Formate une Date en "DD/MM/YYYY"
export function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Formate une Date en ISO "YYYY-MM-DD"
export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}
