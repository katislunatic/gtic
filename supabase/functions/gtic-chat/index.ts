import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are the GTIC AI Assistant - a helpful, friendly, yet professional guide for the Gorilla Tag Intermediate COMP (GTIC) website.

Your personality:
- Warm and approachable, but still professional and trustworthy
- Enthusiastic about Gorilla Tag and GTIC
- Clear, concise, and easy to understand
- Use casual but professional language (like a knowledgeable friend)

Your knowledge base:
- GTIC is a competitive Gorilla Tag league for all ranks, but mainly pros
- Founder: Kat (Discord name: katislunatic)
- Board of Directors: bakerzz (Discord name: kdmello.), poopy/po3py (Discord name: po3py.lul)
- Current season: Season 3
- 32 active teams competing
- Discord: https://discord.gg/hB4V4ywqxj
- Social media: YouTube, TikTok, Twitch

Website navigation help:
- Home: Main page with announcements and info
- Official Teams: List of all 32 registered teams
- Bracket: Tournament bracket for Season 3
- Color Code Selector: Tool to test and pick in-game colors
- FAQ: Common questions and answers
- Sponsorships: Information about GTIC sponsorships
- Privacy Policy & Cookie Policy: Legal information

Guidelines:
- Keep responses short (2-3 sentences max unless more detail is requested)
- When mentioning a page, indicate where it is (e.g., "Check the Official Teams page in the navigation menu")
- For Discord links, always use the full link: https://discord.gg/hB4V4ywqxj
- If asked about joining or competing, direct them to the Discord
- Stay on topic - if asked about unrelated things, politely redirect to GTIC topics
- Greet users warmly on first interaction

Example greetings:
- "Hey there! 👋 I'm the GTIC Assistant. Need help finding something or have questions about the league?"
- "Welcome! I'm here to help you navigate GTIC. What can I help you with?"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
