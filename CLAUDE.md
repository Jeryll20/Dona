# CLAUDE.md — Dona App

This file is the source of truth for Claude Code working on the **Dona** project.
Read it entirely before making any change. Follow every instruction here precisely.

---

## 📱 Project Overview

**Dona** is a smart personal planning mobile app that goes beyond a classic calendar.
It learns the user's lifestyle through onboarding and proactively suggests how to optimize their free time — scheduling sports sessions, rest periods, personal goals, and habit building.

**Target platforms:** iOS & Android
**Framework:** React Native + Expo (managed workflow)
**Language:** TypeScript (strict mode)
**Code language:** English (comments, variables, functions, files)
**State management:** Zustand
**Navigation:** Expo Router (file-based)
**Backend / Auth:** Supabase
**Maps:** Google Maps (via `react-native-maps` + Places API)
**Notifications:** Expo Notifications

---

## 🗂️ Repository

**GitHub:** https://github.com/Jeryll20/Dona
**Main branch:** `main`
**Working branch convention:** `feat/<feature-name>`, `fix/<bug-name>`, `chore/<task>`

---

## 🔄 Git Workflow — MANDATORY

After **every completed task**, Claude Code must:

1. Stage all modified/created files:
   ```bash
   git add .
   ```
2. Commit with a clear conventional message:
   ```bash
   git commit -m "feat: <short description of what was done>"
   ```
   Use prefixes: `feat:`, `fix:`, `chore:`, `style:`, `refactor:`, `docs:`

3. Push to the current branch:
   ```bash
   git push origin <current-branch>
   ```

> ⚠️ Never skip the push step. Every session must end with changes pushed to GitHub.

---

## 🎨 Visual Identity — EXTRACTED FROM DESIGN FILE

### App Name
**Dona**

### Logo
The Dona logo is a rounded square with a gradient background and a white "D" shape inside:
- Container: rounded square, `border-radius: size * 0.32`
- Background: `linear-gradient(145deg, var(--primary), var(--primary-strong))`
- Shadow: `0 6px 16px oklch(0.6 0.13 292 / 0.4)`
- Icon: white SVG path forming a stylized "D" letter
  ```svg
  <path fill="#fff" fillRule="evenodd"
    d="M 10,0 L 56,0 C 97,0 122,28 122,62 C 122,96 97,124 56,124 L 10,124 Z
       M 38,23 L 54,23 C 78,23 96,40 96,62 C 96,84 78,101 54,101 L 38,101
       C 38,90 39,85 47,79 C 57,71 62,65 62,57 C 62,49 57,43 47,37 C 39,32 38,23 38,23 Z" />
  ```

### Typography
**Font family:** `Hanken Grotesk` (Google Fonts), fallback: `-apple-system, system-ui, sans-serif`
**Weights used:** 300, 400, 500, 600, 700, 800

| Role | Size | Weight |
|---|---|---|
| Screen title (h1) | 30px | 800 |
| Section title | 23–26px | 800 |
| Onboarding title | 29–38px | 700–800 |
| Card title | 16–17px | 700 |
| Body text | 15–16px | 400–500 |
| Caption / sub | 13–14px | 600 |
| Timeline hour labels | 11.5px | 600 |
| Tab labels | 11.5px | 600–700 |

### Color Palette (OKLCH — source of truth)

> All colors use the OKLCH color space. Convert to hex for React Native using a utility.

**Canvas & Surfaces**
```
--bg:            oklch(0.972 0.008 290)   → #F5F3FB (approx)
--bg-2:          oklch(0.955 0.012 290)   → #EEEBf7 (approx)
--surface:       oklch(1 0 0)             → #FFFFFF
--surface-sunk:  oklch(0.965 0.01 290)    → #F2EFF9 (approx)
```

**Ink (text)**
```
--ink:    oklch(0.26 0.02 290)   → #332B45 (approx) — primary text
--ink-2:  oklch(0.46 0.02 290)   → #5E5470 (approx) — secondary text
--ink-3:  oklch(0.62 0.018 290)  → #8B83A0 (approx) — muted / captions
--hairline: oklch(0.91 0.012 290) → #E4E0EF (approx) — dividers
```

**Primary — Periwinkle Violet**
```
--primary:        oklch(0.6 0.13 292)    → #7C6FCD (approx)
--primary-strong: oklch(0.52 0.15 292)   → #6254B8 (approx)
--primary-tint:   oklch(0.95 0.035 292)  → #EDE9FA (approx)
--primary-tint-2: oklch(0.9 0.05 292)    → #DDD6F5 (approx)
--on-primary:     oklch(0.99 0.005 290)  → #FEFEFE
```

**Category Colors (timeline blocks)**
```
Sommeil (sleep):
  --c-sommeil:     oklch(0.91 0.045 278)  → #DDD9F2 (approx) — background
  --c-sommeil-ink: oklch(0.46 0.09 278)   → #5A52A0 (approx) — text/icon

Travail (work):
  --c-travail:     oklch(0.9 0.05 298)    → #DBD9F5 (approx)
  --c-travail-ink: oklch(0.46 0.11 298)   → #524FB5 (approx)

Activité (sport/activity):
  --c-activite:    oklch(0.92 0.045 18)   → #F5E0DA (approx)
  --c-activite-ink: oklch(0.52 0.1 18)    → #C0533A (approx)

Trajet (commute) — thin stripe only:
  --c-trajet:      oklch(0.93 0.018 290)  → #EAE7F2 (approx)
  --c-trajet-ink:  oklch(0.55 0.02 290)   → #7A7290 (approx)

Repas (meals):
  --c-repas:       oklch(0.93 0.05 140)   → #DCF2E3 (approx)
  --c-repas-ink:   oklch(0.48 0.08 145)   → #3A8A50 (approx)
```

### Border Radii
```
--r-card:  24px   — main cards
--r-block: 18px   — inner blocks / activity items
--r-input: 14px   — inputs, list rows
--r-pill:  999px  — buttons, tags
```

### Shadows
```
--shadow-sm:   0 1px 2px rgba(46,32,72,0.04), 0 6px 18px rgba(46,32,72,0.05)
--shadow-md:   0 2px 6px rgba(46,32,72,0.06), 0 18px 40px rgba(46,32,72,0.12)
--shadow-lift: 0 1px 3px rgba(46,32,72,0.05), 0 10px 30px rgba(46,32,72,0.09)
```

### Background (body / app root)
```
Radial gradient — soft lavender haze:
  radial-gradient(120% 80% at 15% -10%, oklch(0.95 0.03 300) 0%, transparent 55%),
  radial-gradient(120% 90% at 100% 110%, oklch(0.95 0.025 250) 0%, transparent 50%),
  oklch(0.93 0.012 285)
```

---

## 🖼️ Screen Map (extracted from design prototype)

### Onboarding Flow
```
ob-intro          Welcome screen (Logo + tagline + 3 feature bullets → "On y va ?")
  ob-q1           Q1: Bedtime — TimeField picker (default "23:00")
  ob-q2           Q2: Sleep duration — Stepper (5–11h, default 8)
  ob-q3           Q3: Morning prep — 3 options (1h / 40min / 20min)
  ob-q4           Q4: Number of meals — Stepper (1–5, default 3)
  ob-q5           Q5: Activity types — Multi-select (Travail, Apprentissage, Sport, Culture, Autre)
  ob-q6           Q6: Main goal — Single select (Organisé / Ajouter activité / Créer routine)
  ob-creation     Loader screen (spinner → checkmark, 2.2s → 3.4s)
  ob-conversation Conversational follow-up (2 bubble questions about sport/work)
  ob-recap        Day preview summary → "C'est parti !" → home
```

### Main App (Tab Bar: Activités | Aujourd'hui | Profil)
```
home              Today timeline (scrollable 24h grid, colored blocks per category)
activities        My activities list + "Ajouter une activité" CTA
profile           Profile settings (sleep, cycle, preferences rows)
  profile-sleep   Sleep detail editor (bedtime + waketime + prep time)
  profile-cycle   Cycle settings editor
```

### Overlays / Sheets
```
AddActivityFlow   Bottom sheet — 3 steps:
  Step 0: Category picker (Travail / Sport-activité / Repas / Trajet)
  Step 1: Time range + days selector (multi-day pills + Lundi–Dimanche)
  Step 2: Recurrence (Chaque semaine / Tournant / Aléatoire)
```

---

## 🧩 UI Component Library (from design)

These components must be built as the design system foundation:

### `Icon` — stroke icon set
Icons: `today`, `list`, `profile`, `arrow`, `back`, `plus`, `check`, `x`,
`chevdown`, `chevright`, `moon`, `fork`, `run`, `car`, `target`, `spark`,
`cycle`, `clock`, `edit`, `calendar`, `book`, `palette`
Props: `name`, `size` (default 24), `stroke`, `sw` (strokeWidth, default 1.8)

### `Screen` — scrollable screen shell
Props: `children`, `pad` (boolean, default true), `style`
Behavior: `overflowY: scroll`, `fadeIn .35s ease` animation on mount

### `TopSafe` — dynamic island spacer
Props: `h` (default 64px)

### `PrimaryButton` — pill CTA
Props: `children`, `onClick`, `icon` (default "arrow"), `disabled`, `full`, `style`
Active state: `scale(0.97)` on pointer down
Shadow: `0 6px 18px oklch(0.6 0.13 292 / 0.32)`

### `GhostButton` — secondary pill button
Props: `children`, `onClick`, `style`
Background: `--surface`, shadow: `--shadow-sm`

### `Progress` — onboarding progress bar
Props: `value` (0–1)
Style: 7px tall, gradient fill `--primary → --primary-strong`, animated width

### `Eyebrow` — section label with icon
Props: `children`, `icon`
Style: small pill, `--primary-tint` bg, `--primary-strong` text

### `OptionRow` — selectable list option
Props: `key`, `label`, `sub`, `icon`, `selected`, `onClick`, `multi`
Selected state: `--primary-tint` bg + `--primary` border ring

### `TimeField` — iOS-style scroll wheel time picker
Props: `value` (string "HH:MM"), `onChange`

### `Stepper` — increment/decrement number picker
Props: `value`, `setValue`, `min`, `max`, `suffix`

### `Card` — surface card container
Props: `children`, `style`
Style: `--surface` bg, `--r-block` radius, `--shadow-sm`

### `Sheet` — bottom sheet modal
Props: `open`, `onClose`, `title`, `children`
Animation: `sheetUp` (slide from bottom)

### `TabBar` — fixed bottom navigation
3 tabs: `activities` (list icon) | `home` (today icon) | `profile` (profile icon)
Active: `--primary-tint` bg pill, `--primary-strong` icon+label
Inactive: `--ink-3` icon+label
Container: `--surface` bg, `--r-card` radius, `--shadow-lift`

### `Logo` — app logo component
Props: `size` (default 40)
See logo SVG spec in Visual Identity section above.

---

## 📋 Onboarding Q&A Detail

| Step | Screen | Question (FR) | Input type | State key |
|---|---|---|---|---|
| 1 | ob-q1 | À quelle heure te couches-tu en général ? | TimeField | `bedtime` |
| 2 | ob-q2 | Combien d'heures aimerais-tu dormir ? | Stepper 5–11h | `sleepHours` |
| 3 | ob-q3 | Le matin, combien de temps pour te préparer ? | 3 options (1h/40/20) | `prep` |
| 4 | ob-q4 | Combien de repas prends-tu par jour ? | Stepper 1–5 | `meals` |
| 5 | ob-q5 | Quels types d'activités pratiques-tu ? | Multi-select 5 options | `activities[]` |
| 6 | ob-q6 | Quel est ton objectif principal ? | Single select 3 options | `goal` |

**Onboarding answers initial state:**
```ts
{
  bedtime: "23:00",
  waketime: "07:00",
  sleepHours: 8,
  prep: "40",      // minutes as string key
  meals: 3,
  activities: ["Travail", "Sport"],
  goal: "organise"
}
```

---

## 📅 Timeline — Activity Categories & Data Model

### Category map
```ts
const CAT = {
  sommeil:  { bg: "--c-sommeil",  ink: "--c-sommeil-ink",  icon: "moon" },
  prep:     { bg: "--c-repas",    ink: "--c-repas-ink",    icon: "spark" },
  travail:  { bg: "--c-travail",  ink: "--c-travail-ink",  icon: "list" },
  activite: { bg: "--c-activite", ink: "--c-activite-ink", icon: "run" },
  trajet:   { bg: "--c-trajet",   ink: "--c-trajet-ink",   icon: "car" },
  repas:    { bg: "--c-repas",    ink: "--c-repas-ink",    icon: "fork" },
}
```

### Event data model
```ts
type TimelineEvent = {
  cat: "sommeil" | "prep" | "travail" | "activite" | "trajet" | "repas"
  title: string
  start: number   // decimal hours (e.g. 7.67 = 07:40)
  end: number
  thin?: boolean  // thin stripe style for short commute blocks
  dur?: string    // display string for thin blocks (e.g. "20 min")
}
```

### Default day example (from prototype)
```ts
const DEFAULT_DAY = [
  { cat: "sommeil",  title: "Sommeil",          start: 0,     end: 7 },
  { cat: "prep",     title: "Préparation",       start: 7,     end: 7.67 },
  { cat: "trajet",   title: "Trajet bureau",     start: 7.67,  end: 8,     thin: true, dur: "20 min" },
  { cat: "travail",  title: "Travail",           start: 8,     end: 12.5 },
  { cat: "repas",    title: "Déjeuner",          start: 12.5,  end: 13.5 },
  { cat: "travail",  title: "Travail",           start: 13.5,  end: 17 },
  { cat: "trajet",   title: "Trajet bureau",     start: 17,    end: 17.33, thin: true, dur: "20 min" },
  { cat: "trajet",   title: "Trajet activité",   start: 18,    end: 18.17, thin: true, dur: "10 min" },
  { cat: "activite", title: "Cours d'anglais",   start: 18.17, end: 19.17 },
  { cat: "repas",    title: "Dîner",             start: 20,    end: 20.75 },
  { cat: "sommeil",  title: "Sommeil",           start: 23,    end: 24 },
]
```

### Timeline rendering
- `HH = 58` px per hour
- Grid: 25 horizontal lines (00h–24h), `--hairline` color
- "Now" indicator: purple dot + horizontal line at current time
- Block height: `(end - start) * HH`, minimum 16px
- Tall blocks (height > 44px): show title + time range
- Thin blocks: left border stripe + icon + title + duration, no background fill

---

## 🧠 Time Optimization Engine

Dona's core differentiator. Detects free slots and generates contextual suggestions.

### Algorithm
1. Build fixed blocks from user profile (sleep, work, meals, sport, activities)
2. Detect unscheduled time windows ≥ 15 minutes
3. Score each window by:
   - Time of day (morning = focus, post-lunch = light, evening = wellness)
   - Duration available
   - User goals from onboarding (`goal` field)
   - Activity interests (`activities[]` field)
   - Menstrual cycle phase (if applicable)
4. Return 1–3 ranked suggestions per free slot

### Suggestion categories
| Category | Examples |
|---|---|
| Sport & Movement | "30-min walk", "Yoga", "Stretching" |
| Personal Goals | "Work on side project", "Language learning 20min" |
| Rest & Wellness | "Power nap 20min", "Meditation", "Digital detox" |
| Social | "Call a friend", "Plan dinner" |
| Admin | "Pay bills", "Grocery list" |
| Learning | "Read 30min", "Watch a tutorial" |

### Menstrual cycle phases
| Phase | Days | Suggestions |
|---|---|---|
| Menstrual | 1–5 | Rest, gentle yoga, warm meals |
| Follicular | 6–13 | High energy → hard workouts, focus work |
| Ovulation | 14–16 | Social, creative work |
| Luteal | 17–28 | Wind-down, lighter exercise, journaling |

---

## 📁 App Architecture

```
dona/
├── app/                          # Expo Router pages
│   ├── (auth)/
│   │   ├── welcome.tsx           # ob-intro
│   │   └── onboarding/
│   │       ├── q1-bedtime.tsx
│   │       ├── q2-sleep-duration.tsx
│   │       ├── q3-prep-time.tsx
│   │       ├── q4-meals.tsx
│   │       ├── q5-activities.tsx
│   │       ├── q6-goal.tsx
│   │       ├── creation.tsx      # loader
│   │       ├── conversation.tsx  # chat bubbles follow-up
│   │       └── recap.tsx         # day preview + CTA
│   ├── (tabs)/
│   │   ├── index.tsx             # home — today timeline
│   │   ├── activities.tsx        # my activities list
│   │   └── profile.tsx           # profile + settings
│   ├── profile/
│   │   ├── sleep.tsx             # profile-sleep
│   │   └── cycle.tsx             # profile-cycle
│   └── _layout.tsx
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Icon.tsx
│   │   ├── Screen.tsx
│   │   ├── TopSafe.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── GhostButton.tsx
│   │   ├── Progress.tsx
│   │   ├── Eyebrow.tsx
│   │   ├── OptionRow.tsx
│   │   ├── TimeField.tsx
│   │   ├── Stepper.tsx
│   │   ├── Card.tsx
│   │   ├── Sheet.tsx
│   │   ├── TabBar.tsx
│   │   └── Logo.tsx
│   ├── timeline/
│   │   ├── TimelineBlock.tsx     # colored event block
│   │   ├── ThinBlock.tsx         # commute stripe block
│   │   ├── NowIndicator.tsx      # current time line
│   │   └── HourGrid.tsx          # background hour lines
│   ├── onboarding/
│   │   └── QShell.tsx            # generic question wrapper
│   ├── suggestions/
│   │   └── SuggestionCard.tsx
│   └── activities/
│       └── ActivityRow.tsx
├── store/
│   ├── useUserStore.ts           # onboarding answers + profile
│   ├── useScheduleStore.ts       # timeline events
│   └── useSuggestionsStore.ts
├── lib/
│   ├── supabase.ts
│   ├── optimizer.ts              # free slot detection + scoring
│   ├── cycle.ts                  # menstrual phase calculator
│   └── notifications.ts
├── constants/
│   ├── colors.ts                 # all CSS vars as RN hex values
│   ├── typography.ts             # font sizes + weights
│   ├── spacing.ts
│   └── categories.ts             # CAT map
├── types/
│   └── index.ts                  # TimelineEvent, UserProfile, Suggestion, etc.
└── assets/
    └── fonts/                    # Hanken Grotesk woff2 files
```

---

## 🛠️ Development Rules

1. **TypeScript strict** — no `any`. Always type component props and store slices.
2. **Components** — functional only, hooks only.
3. **Styling** — `StyleSheet.create()` using tokens from `constants/colors.ts`. No inline magic numbers or hardcoded hex values.
4. **Color system** — convert OKLCH values to hex for React Native. Store all colors in `constants/colors.ts`.
5. **Font** — use `Hanken Grotesk` via `expo-font`. Load all weights (300–800).
6. **No hardcoded strings** — all French UI text in `constants/strings.ts`.
7. **Accessibility** — all interactive elements must have `accessibilityLabel`.
8. **Animations** — use `Animated` API or `react-native-reanimated` for transitions. Match design animations: `fadeUp`, `fadeIn`, `sheetUp`, `spin`, `pulse`.
9. **File naming** — `PascalCase` for components, `camelCase` for utils/stores.
10. **Commits** — conventional commits, pushed after every feature (see Git Workflow).

---

## 🚀 Getting Started

```bash
git clone https://github.com/Jeryll20/Dona.git
cd Dona
npm install
npx expo start

# Test on device
npx expo run:ios
npx expo run:android
```

---

## 📌 Development Checklist

- [ ] Project init (Expo + TypeScript)
- [ ] `constants/` — colors, typography, spacing, categories
- [ ] `components/ui/` — full design system (Icon, Button, Screen, etc.)
- [ ] Onboarding flow — all 9 screens (intro → recap)
- [ ] Home / Today timeline screen
- [ ] Activities list + AddActivityFlow sheet
- [ ] Profile screen + Sleep/Cycle detail screens
- [ ] Time optimization engine (`lib/optimizer.ts`)
- [ ] Suggestion cards UI
- [ ] Supabase auth & data persistence
- [ ] Expo Notifications
- [ ] Menstrual cycle module (`lib/cycle.ts`)
- [ ] Google Maps integration

---

*Last updated: June 2026 — generated from Dona.html prototype*
