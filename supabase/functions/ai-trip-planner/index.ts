import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a local Manipal and coastal Karnataka expert who has lived in the region for years and knows every hidden spot, local eatery, beach, and viewpoint. You help students from Manipal Institute of Technology and MAHE discover the best of Udupi district and coastal Karnataka. Always recommend real, specific places. Be warm, conversational, like a senior student giving advice to a junior.

Use REAL places only (cafes like Hangyo/Hadiqa/Mitra Samaj/Diana, beaches like Malpe/Kapu/Hoode, viewpoints, treks, temples, bars/lounges in Mangalore). Be specific with timings, transport, and per-person costs in INR. Mention insider tips (best time, what to order, how to get there from Manipal — bus number, scooter, Rapido cost).

Call the tool "build_itinerary" exactly once. No prose outside the tool call.`;

const TOOL = {
  type: "function",
  function: {
    name: "build_itinerary",
    description: "Return a complete day-by-day itinerary.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Catchy 4-7 word trip title" },
        summary: { type: "string", description: "2-3 sentence overview of the vibe" },
        total_estimated_cost_inr: { type: "number", description: "Per-person total in INR" },
        packing_tips: { type: "array", items: { type: "string" } },
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day_number: { type: "number" },
              theme: { type: "string", description: "e.g. 'Beach + sunset chill'" },
              blocks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: { type: "string", description: "e.g. '7:00 AM' or '6 PM - 8 PM'" },
                    activity: { type: "string" },
                    location: { type: "string" },
                    details: { type: "string", description: "What to do, what to order, insider tip" },
                    transport: { type: "string", description: "How to get here from previous spot" },
                    cost_inr: { type: "number" },
                  },
                  required: ["time", "activity", "location", "details", "cost_inr"],
                },
              },
            },
            required: ["day_number", "theme", "blocks"],
          },
        },
      },
      required: ["title", "summary", "total_estimated_cost_inr", "packing_tips", "days"],
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

    const { duration, budget, vibe, groupSize, startDate, extras } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userMsg = `Plan a trip with these inputs:
- Duration: ${duration} day(s)
- Budget per person: ₹${budget}
- Vibe / theme: ${vibe}
- Group size: ${groupSize}
- Starting date: ${startDate || "this weekend"}
- Extra notes: ${extras || "none"}

Build ${duration} day(s) with 4-6 time blocks per day (morning, lunch, afternoon, sunset, dinner, optional night). Keep total within ₹${budget} per person. Mix categories — don't put all cafes or all beaches.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "build_itinerary" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("trip-planner gateway error", response.status, text);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Vibe is overloaded, try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return an itinerary" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let parsed: any;
    try { parsed = JSON.parse(toolCall.function.arguments); }
    catch { return new Response(JSON.stringify({ error: "AI returned malformed JSON" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-trip-planner error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});