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
  firstName?:    string;
  bedtime?:      string;
  waketime?:     string;
  prepMinutes?:  number;
  meals?:        MealEntry[];
  activities?:   string;
  goal?:         string;
  cycleTracking?: boolean;
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
  const lines: string[] = [];
  if (ctx.firstName)      lines.push(`Prénom : ${ctx.firstName}`);
  if (ctx.bedtime)        lines.push(`Sommeil : coucher ${ctx.bedtime}, réveil ${ctx.waketime}, préparation matin ${ctx.prepMinutes ?? 40} min`);
  if (ctx.meals?.length)  lines.push(`Repas : ${ctx.meals.map((m) => `${m.label} à ${m.time}`).join(', ')}`);
  if (ctx.activities)     lines.push(`Activités pratiquées : ${ctx.activities}`);
  if (ctx.goal)           lines.push(`Objectif principal : ${GOAL_LABELS[ctx.goal] ?? ctx.goal}`);
  if (ctx.cycleTracking)  lines.push('Suit son cycle menstruel');

  const context = lines.length ? `\n\nProfil de l'utilisateur :\n${lines.join('\n')}` : '';

  return `Tu es Dona, une assistante planning bienveillante, chaleureuse et personnelle.
Tu réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks) avec ce format :
{
  "message": "ta réponse en français, concise et chaleureuse (max 3 phrases)",
  "chips": ["option courte 1", "option courte 2"] ou null,
  "navigate": "/profile/sleep" ou null
}

Routes disponibles pour navigate :
- "/profile/sleep"      → modifier le sommeil / réveil
- "/profile/meals"      → modifier les repas
- "/profile/cycle"      → modifier le suivi du cycle menstruel
- "/profile/account"    → modifier le profil (prénom, nom, date de naissance)
- "/(tabs)/activities"  → voir et gérer les activités${context}

Règles :
- Réponds toujours en français, avec un ton doux et encourageant
- Sois concise (max 3 phrases par réponse)
- Propose des chips (max 3) pour guider la conversation quand c'est pertinent
- Propose navigate uniquement si l'utilisateur veut modifier un paramètre précis
- N'invente jamais de données que tu ne connais pas
- Ramène doucement à l'organisation du temps si la question est hors sujet`;
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

    const body = await req.json() as RequestBody;
    const { message, history, userContext } = body;

    console.log('Received message:', message);

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
        temperature:     0.65,
        max_tokens:      400,
      }),
    });

    const rawText = await res.text();
    console.log('Mistral status:', res.status, 'body:', rawText.slice(0, 200));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Mistral error ${res.status}: ${rawText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(rawText);
    const raw: string = data.choices[0].message.content;

    let parsed: { message: string; chips?: string[] | null; navigate?: string | null };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw, chips: null, navigate: null };
    }

    if (!parsed.message)               parsed.message  = "Je n'ai pas pu générer une réponse. Réessaie.";
    if (!Array.isArray(parsed.chips))  parsed.chips    = null;
    if (typeof parsed.navigate !== 'string') parsed.navigate = null;

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
