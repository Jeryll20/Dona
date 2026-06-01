// All user-facing strings — i18n-ready. Never hardcode strings in components.

export const Strings = {
  app: {
    name: 'Dona',
    tagline: 'Your smart personal planner',
  },

  tabs: {
    today: "Today",
    week: "Week",
    suggestions: "Suggestions",
    profile: "Profile",
  },

  today: {
    title: "Today",
    hoursPlanned: (h: number) => `${h}h planned`,
  },

  suggestions: {
    title: "Suggestions",
    subtitle: "Make the most of your free time.",
    empty: "No suggestions yet — complete your onboarding first.",
  },

  profile: {
    title: "My Profile",
    settings: "Settings",
    rhythm: "My rhythm",
    sleep: "Sleep settings",
    cycle: "Cycle settings",
    meals: "Meals",
    save: "Save",
  },

  onboarding: {
    next: "Continue",
    back: "Back",
    skip: "Skip",
    finish: "Get started",

    welcome: {
      headline: "Welcome to Dona",
      body: "Your smart planner that learns your lifestyle and helps you make the most of your time.",
      cta: "Let's get started",
    },

    step1: {
      title: "Tell us about yourself",
      fullName: "Full name",
      dateOfBirth: "Date of birth",
      email: "Email address",
    },

    step2: {
      title: "When do you sleep?",
      bedtime: "Bedtime",
      wakeUp: "Wake-up time",
      prepTime: "Morning preparation",
      prepSuffix: "min",
    },

    step3: {
      title: "When do you eat?",
      addMeal: "+ Add a meal",
      mealLabel: (n: number) => `Meal ${n}`,
    },

    step4: {
      title: "Do you exercise?",
      yes: "Yes",
      no: "Not yet",
      wouldLike: "I'd like to",
      what: "What activity?",
      when: "When?",
      where: "Where?",
    },

    step5: {
      title: "Do you have a job?",
      yes: "Yes",
      no: "No",
      wouldLike: "I'd like to",
      what: "What do you do?",
      when: "Work hours?",
      where: "Where do you work?",
    },

    step6: {
      title: "Any other activities?",
      yes: "Yes",
      no: "No",
      wouldLike: "I'd like to",
      what: "What activity?",
      when: "When?",
      where: "Where?",
    },

    step7: {
      title: "Menstrual cycle",
      lastPeriod: "Date of last period",
      cycleDuration: "Cycle duration",
      cycleSuffix: "days",
      noMenstruation: "No menstruation",
    },
  },

  categories: {
    sleep: "Sleep",
    prep: "Preparation",
    work: "Work",
    activity: "Activity",
    transit: "Transit",
    meal: "Meal",
    rest: "Rest",
    goal: "Personal goal",
    social: "Social",
    admin: "Admin",
    learning: "Learning",
  },

  errors: {
    required: "This field is required",
    invalidEmail: "Please enter a valid email",
  },
} as const;
