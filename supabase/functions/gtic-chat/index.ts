import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load conversation history if conversationId is provided
    let conversationMessages = messages;
    if (conversationId) {
      const { data: historyData, error: historyError } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error loading conversation history:', historyError);
      } else if (historyData && historyData.length > 0) {
        // Use history + new message
        conversationMessages = [...historyData, ...messages];
      }
    }

    const systemPrompt = `You are the GTIC AI Assistant - a helpful, friendly, yet professional guide for the Gorilla Tag Intermediate COMP (GTIC) website.

Your personality:
- Warm and approachable, but still professional and trustworthy
- Enthusiastic about Gorilla Tag and GTIC
- Clear, concise, and easy to understand
- Use casual but professional language (like a knowledgeable friend)

Your knowledge base:
- GTIC is a competitive Gorilla Tag league for all ranks, but mainly pros
- Founded by: Kat (Discord name: katislunatic) - Kat is the CEO/Founder of Orbis Studios, which now owns GTIC. When asked who owns GTIC, explain that Kat founded it and is the CEO/Founder of Orbis Studios, which now owns the league.
- Board of Directors: Kat, Bakerzz (Discord name: kdmello.), Poopy/Po3py (Discord name: po3py.lul)
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
- You can generate helpful images to guide users (e.g., screenshots, diagrams, visual guides)
- When users need help finding something, consider generating an image showing where to look

Example greetings:
- "Hey there! 👋 I'm the GTIC Assistant. Need help finding something or have questions about the league?"
- "Welcome! I'm here to help you navigate GTIC. What can I help you with?"`;

    // Save user message to database if conversationId exists
    if (conversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const messageContent = typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : JSON.stringify(lastMessage.content);
      
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: lastMessage.role,
        content: messageContent,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages,
        ],
        stream: true,
        modalities: ["text", "image"],
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

    // Stream response back to client while collecting assistant's response
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let assistantMessage = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            // Collect assistant response for saving
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const json = JSON.parse(line.slice(6));
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) assistantMessage += content;
                } catch {}
              }
            }
            
            controller.enqueue(value);
          }
          
          // Save assistant message to database if conversationId exists
          if (conversationId && assistantMessage) {
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: assistantMessage,
            });
          }
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
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
