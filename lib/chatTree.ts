// Pre-written conversation tree — MVP chatbot (no AI)
// Each node has a bot message and a set of user choices.

export type ChatAction =
  | { type: 'next';     node: string }
  | { type: 'navigate'; route: string }
  | { type: 'close' };

export interface ChatChoice {
  label:  string;
  action: ChatAction;
}

export interface ChatNode {
  message: string;
  choices: ChatChoice[];
}

export const CHAT_TREE: Record<string, ChatNode> = {

  welcome: {
    message: "Bonjour ! Je suis Dona 👋\nComment puis-je t'aider aujourd'hui ?",
    choices: [
      { label: 'Mon planning ne me correspond pas', action: { type: 'next', node: 'planning-mismatch' } },
      { label: 'Je veux ajouter une activité',      action: { type: 'next', node: 'add-activity'     } },
      { label: 'Modifier mes paramètres',           action: { type: 'next', node: 'modify-settings'  } },
      { label: 'Comment fonctionne Dona ?',         action: { type: 'next', node: 'how-it-works'     } },
    ],
  },

  'planning-mismatch': {
    message: "Qu'est-ce qui ne te correspond pas ?",
    choices: [
      { label: 'Mes horaires de sommeil', action: { type: 'navigate', route: '/profile/sleep'       } },
      { label: 'Mes activités',           action: { type: 'navigate', route: '/(tabs)/activities'   } },
      { label: 'Mes paramètres de cycle', action: { type: 'navigate', route: '/profile/cycle'       } },
      { label: '← Retour',               action: { type: 'next',     node:  'welcome'               } },
    ],
  },

  'add-activity': {
    message: "Tu peux ajouter et gérer tes activités depuis l'onglet Activités. Je t'y emmène ?",
    choices: [
      { label: 'Oui, allons-y !', action: { type: 'navigate', route: '/(tabs)/activities' } },
      { label: 'Non merci',       action: { type: 'next',     node:  'welcome'             } },
    ],
  },

  'modify-settings': {
    message: 'Quel paramètre souhaites-tu modifier ?',
    choices: [
      { label: 'Sommeil',         action: { type: 'navigate', route: '/profile/sleep'     } },
      { label: 'Cycle menstruel', action: { type: 'navigate', route: '/profile/cycle'     } },
      { label: 'Activités',       action: { type: 'navigate', route: '/(tabs)/activities' } },
      { label: '← Retour',        action: { type: 'next',     node:  'welcome'             } },
    ],
  },

  'how-it-works': {
    message:
      "Dona génère ton planning automatiquement à partir de ton profil : sommeil, repas, activités.\n\n" +
      "Tu peux modifier n'importe quel paramètre à tout moment depuis ton profil.",
    choices: [
      { label: 'Ajouter quelque chose',  action: { type: 'next', node: 'add-activity'    } },
      { label: 'Modifier mes paramètres',action: { type: 'next', node: 'modify-settings' } },
      { label: "C'est parfait, merci !", action: { type: 'next', node: 'done'            } },
    ],
  },

  done: {
    message: "N'hésite pas à revenir si tu as d'autres questions. Bonne journée ! 🌿",
    choices: [
      { label: 'Fermer', action: { type: 'close' } },
    ],
  },
};
