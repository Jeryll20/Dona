const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MealEntry {
  time: string;
  label: string;
}

interface UserContext {
  firstName?:          string;
  bedtime?:            string;
  waketime?:           string;
  prepMinutes?:        number;
  meals?:              MealEntry[];
  activities?:         string;
  goal?:               string;
  cycleTracking?:      boolean;
  freeSlots?:          string;
  existingActivities?: string;
}

interface RequestBody {
  message:     string;
  history:     HistoryMessage[];
  userContext: UserContext;
}

const GOAL_LABELS: Record<string, string> = {
  organise: 'mieux organisé·e',
  activite: 'ajouter une activité',
  routine:  'créer une routine durable',
};

function buildSystemPrompt(ctx: UserContext): string {
  const profile: string[] = [];
  if (ctx.firstName)      profile.push(`Prénom : ${ctx.firstName}`);
  if (ctx.bedtime)        profile.push(`Coucher : ${ctx.bedtime} | Réveil : ${ctx.waketime} | Préparation matin : ${ctx.prepMinutes ?? 40} min`);
  if (ctx.meals?.length)  profile.push(`Repas : ${ctx.meals.map((m) => `${m.label} à ${m.time}`).join(', ')}`);
  if (ctx.activities)     profile.push(`Activités pratiquées : ${ctx.activities}`);
  if (ctx.goal)           profile.push(`Objectif : ${GOAL_LABELS[ctx.goal] ?? ctx.goal}`);
  if (ctx.cycleTracking)  profile.push('Suit son cycle menstruel');

  const profileBlock = profile.length
    ? `\n\n## Profil\n${profile.join('\n')}`
    : '';

  const scheduleBlock = (ctx.freeSlots || ctx.existingActivities)
    ? `\n\n## Planning du jour\nActivités enregistrées : ${ctx.existingActivities ?? 'aucune'}\n\nCréneaux libres :\n${ctx.freeSlots ?? 'inconnus'}`
    : '';

  return `Tu es Dona, une assistante planning intelligente et bienveillante. Ta mission principale est d'aider l'utilisateur à optimiser son planning.${profileBlock}${scheduleBlock}

## Format de réponse
Tu réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks) :
{
  "message": "ta réponse en français, max 2-3 phrases",
  "chips": ["option 1", "option 2"] ou null,
  "navigate": "/profile/sleep" ou null,
  "action": { "type": "...", "payload": {...} } ou null
}

## Actions disponibles

### Ajouter une activité
Quand l'utilisateur veut ajouter une activité, propose un créneau précis basé sur les créneaux libres, puis propose l'action :
{
  "type": "add_activity",
  "payload": {
    "title": "Marche matinale",
    "cat": "activite",
    "startTime": "07:40",
    "endTime": "08:10",
    "days": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    "recurrence": "daily"
  }
}
Valeurs cat valides : "activite", "travail", "repas", "trajet"
Valeurs recurrence : "none", "daily", "weekly", "biweekly"
Jours (EN) : "Mon","Tue","Wed","Thu","Fri","Sat","Sun"

### Modifier le sommeil
{
  "type": "update_sleep",
  "payload": { "bedtime": "22:30", "waketime": "06:30" }
}

## Navigation (si modification manuelle nécessaire)
- "/(tabs)/activities"  → gérer les activités
- "/profile/sleep"      → modifier le sommeil
- "/profile/meals"      → modifier les repas
- "/profile/cycle"      → cycle menstruel

## Règles impératives
1. Utilise TOUJOURS les créneaux libres réels pour proposer des horaires précis
2. Ne propose UNE SEULE action à la fois
3. Quand tu proposes une action, inclus-la dans "action" ET confirme dans le message
4. Ne pose pas de questions inutiles — propose directement un créneau et demande confirmation
5. Chips pour la confirmation : ["Oui, ajouter !", "Modifier l'horaire", "Non merci"] ou similaire
6. Réponds en français, ton humain et encourageant
7. Hors sujet → redirige vers l'organisation sans répondre à la question hors-sujet

## Exemples
- "Je veux 30 min de marche le matin" → trouve le premier créneau libre après le réveil, propose action add_activity avec chips ["Oui, ajouter !", "Modifier l'horaire", "Non merci"]
- "Décale mon réveil à 6h30" → action update_sleep avec waketime "06:30"
- "Qu'est-ce que je peux faire ce soir ?" → analyse les créneaux libres du soir, propose des suggestions adaptées`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!apiKey) {
      console.error('MISTRAL_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'MISTRAL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, history, userContext } = (await req.json()) as RequestBody;
    console.log('Message:', message, '| Free slots:', userContext.freeSlots?.slice(0, 80));

    const systemPrompt = buildSystemPrompt(userContext);

    const mistralMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-12),
      { role: 'user', content: message },
    ];

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:           'mistral-small-latest',
        messages:        mistralMessages,
        response_format: { type: 'json_object' },
        temperature:     0.55,
        max_tokens:      500,
      }),
    });

    const rawText = await res.text();
    if (!res.ok) {
      console.error('Mistral error', res.status, rawText.slice(0, 200));
      return new Response(JSON.stringify({ error: `Mistral ${res.status}: ${rawText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data     = JSON.parse(rawText);
    const raw: string = data.choices[0].message.content;

    let parsed: {
      message:  string;
      chips?:   string[] | null;
      navigate?: string | null;
      action?:  Record<string, unknown> | null;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw };
    }

    if (!parsed.message)               parsed.message  = "Je n'ai pas pu générer une réponse. Réessaie.";
    if (!Array.isArray(parsed.chips))  parsed.chips    = null;
    if (typeof parsed.navigate !== 'string') parsed.navigate = null;
    if (!parsed.action || typeof parsed.action !== 'object') parsed.action = null;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
