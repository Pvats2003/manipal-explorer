import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Vibe Concierge" — a deeply empathetic, encyclopedic local guide for students around Manipal University (Manipal, Udupi, Karnataka, India).

You will receive (a) the user's chat history and (b) their structured preferences. Your job has TWO parts:

PART 1 — READ THE USER'S MOOD
Infer how the user is actually FEELING beneath the words: stressed, bored, heartbroken, hyped, post-exam burnout, social-pressure to plan, FOMO, anxious, romantic, restless, nostalgic, etc. Be human, warm, and specific. One short paragraph (2-3 sentences). Address them as "you".

PART 2 — RECOMMEND SPOTS (8 to 14 of them)
Pull from your full knowledge of REAL places around Manipal/Udupi/Mangalore/Gokarna/Kundapura/Karkala/Agumbe/Murudeshwara/Kollur/Sringeri — beaches, temples, viewpoints, treks, waterfalls, cafes (Hangyo, Hadiqa, Mitra Samaj, Diana, Big Brewsky-style spots), restaurants (Woodlands, Mitra Samaj, 19th Hole, Eat Street), bars/lounges (De Pumba, Tiger Bay, Pabbas-area, Onyx, Liquid Lounge, Eat Street rooftops), nightlife in Mangalore, hidden coves, sunset points (Kapu Lighthouse, Suvarna Sangam, Hoode beach), etc.

For EACH spot, fill EVERY field truthfully. If you genuinely don't know a field, set it to null (do NOT invent phone numbers — set contact to null if unknown). Prefer accuracy over completeness.

Tone for "why_for_you" and "insider_tip": warm, in-the-know, like a senior at MIT Manipal telling a junior.

Call the tool "recommend_spots" exactly once with the result. Do not write any prose outside the tool call.`;

const TOOL = {
  type: "function",
  function: {
    name: "recommend_spots",
    description: "Return mood reading and 8-14 real spots.",
    parameters: {
      type: "object",
      properties: {
        mood_reading: { type: "string" },
        vibe_tags: { type: "array", items: { type: "string" } },
        spots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              area: { type: "string" },
              distance_km_from_manipal: { type: "number" },
              travel_time_minutes: { type: "number" },
              description: { type: "string" },
              why_for_you: { type: "string" },
              best_time_to_visit: { type: "string" },
              opening_hours: { type: "string" },
              contact_phone: { type: "string" },
              website: { type: "string" },
              google_maps_query: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              estimated_cost_per_person_inr: { type: "number" },
              budget_tier: { type: "string" },
              transport_tip: { type: "string" },
              what_to_order_or_do: { type: "array", items: { type: "string" } },
              insider_tip: { type: "string" },
              avoid_if: { type: "string" },
              vibe_match_score: { type: "number" },
            },
            required: [
              "name", "category", "area", "distance_km_from_manipal", "description",
              "why_for_you", "google_maps_query", "estimated_cost_per_person_inr",
              "budget_tier", "transport_tip", "what_to_order_or_do", "vibe_match_score",
            ],
          },
        },
      },
      required: ["mood_reading", "vibe_tags", "spots"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { preferences, chatHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userContext = `STRUCTURED PREFERENCES:\n${JSON.stringify(preferences, null, 2)}\n\n` +
      (chatHistory?.length
        ? `CHAT HISTORY (read between the lines for emotion):\n${chatHistory
            .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n")}`
        : "No chat history — base the mood reading on the structured preferences alone.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContext },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "recommend_spots" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("ai-spots gateway error", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Vibe is overloaded — try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return spots" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed: any;
    try { parsed = JSON.parse(toolCall.function.arguments); }
    catch { return new Response(JSON.stringify({ error: "AI returned malformed JSON" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-spots error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});