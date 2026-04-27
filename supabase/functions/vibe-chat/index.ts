import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Vibe, a fun, warm, casual concierge for Manipal University students looking for hidden spots — beaches, treks, cafes, bars, nightlife, nature.

Your job: in 3-5 short, friendly messages, gather the user's vibe and call the "submit_preferences" tool with whatever you've learned. Ask ONE thing at a time. Keep messages under 2 sentences. Use emojis sparingly.

Things to learn (in rough order):
1. Mood/vibe (chill, adventure, nature, beach, party, food — pick any that fit)
2. Budget (rough ₹ amount, or low/medium/high)
3. Day trip vs multi-day
4. Solo / friends / partner + group size
5. Time of day (morning/afternoon/evening/night), transport (walk/bike/bus/cab/car), crowd (quiet/lively/packed)
6. Anything to AVOID

Be smart: if the user says "weekend with my squad of 5 looking for beach + bars and cheap eats", extract everything at once and confirm.

IMPORTANT: As soon as you have at least: moods, budget, duration, travelType — call submit_preferences. You can fill in sensible defaults for the rest. After calling the tool, send ONE final cheerful message like "On it! Finding your spots... ✨" — do NOT ask more questions.`;

const SUBMIT_TOOL = {
  type: "function",
  function: {
    name: "submit_preferences",
    description: "Submit the user's collected travel preferences once enough info is gathered. The app will then show recommendations.",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "Starting point. Default: 'Manipal, Karnataka'" },
        moods: {
          type: "array",
          items: { type: "string", enum: ["party", "chill", "adventure", "nature", "beach", "food"] },
          description: "Vibes the user wants. Pick 1-4.",
        },
        budget: { type: "string", enum: ["low", "medium", "high"] },
        budgetAmount: { type: "number", description: "Approx ₹ amount per person" },
        duration: { type: "string", enum: ["day", "multi"] },
        travelType: { type: "string", enum: ["solo", "friends", "partner"] },
        groupSize: { type: "number", description: "Number of people, 1-15" },
        timeOfDay: { type: "string", enum: ["morning", "afternoon", "evening", "night"] },
        transport: { type: "string", enum: ["walk", "bike", "bus", "cab", "car"] },
        crowd: { type: "string", enum: ["quiet", "lively", "packed"] },
        avoidMoods: {
          type: "array",
          items: { type: "string", enum: ["party", "chill", "adventure", "nature", "beach", "food"] },
        },
      },
      required: ["moods", "budget", "budgetAmount", "duration", "travelType"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: claimsData, error: claimsErr } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        tools: [SUBMIT_TOOL],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Gateway error", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit, try again in a moment." }), {
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
    const choice = data.choices?.[0]?.message;
    const toolCall = choice?.tool_calls?.[0];
    let preferences = null;
    if (toolCall?.function?.name === "submit_preferences") {
      try { preferences = JSON.parse(toolCall.function.arguments); } catch { /* ignore */ }
    }

    return new Response(
      JSON.stringify({ reply: choice?.content || "", preferences }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("vibe-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});