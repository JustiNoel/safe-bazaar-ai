import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[SELLER-API] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get API key from header
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      throw new Error("API key required. Include x-api-key header.");
    }

    // Validate API key
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("user_id, subscription_tier, api_calls_today, premium")
      .eq("api_key", apiKey)
      .single();

    if (profileError || !profile) {
      throw new Error("Invalid API key");
    }

    if (profile.subscription_tier !== "premium_seller") {
      throw new Error("API access requires Premium Seller subscription");
    }

    // Check rate limit (100 calls per day)
    if (profile.api_calls_today >= 100) {
      throw new Error("Daily API limit reached (100 calls/day)");
    }

    // Increment API call count
    await supabaseClient
      .from("profiles")
      .update({ api_calls_today: profile.api_calls_today + 1 })
      .eq("user_id", profile.user_id);

    logStep("API key validated", { userId: profile.user_id, callsToday: profile.api_calls_today + 1 });

    const url = new URL(req.url);
    const endpoint = url.pathname.split("/").pop();

    // Handle different endpoints
    switch (endpoint) {
      case "scan": {
        const { name, price, imageUrl, description } = await req.json();
        
        if (!name) {
          throw new Error("Product name is required");
        }

        const xaiApiKey = Deno.env.get("XAI_API_KEY");
        if (!xaiApiKey) {
          throw new Error("AI service not configured");
        }

        const aiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${xaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "grok-2-vision-1212",
            messages: [
              {
                role: "system",
                content: `You are a product authenticity analyzer. Return JSON with:
                - overall_score (0-100)
                - verdict (SAFE/CAUTION/DANGER)
                - risk_factors (array)
                - recommendations (array)
                Only return valid JSON.`
              },
              {
                role: "user",
                content: `Analyze: ${name}, Price: ${price || "N/A"}, Description: ${description || "N/A"}`
              }
            ],
            temperature: 0.3,
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices[0]?.message?.content || "{}";
        
        let assessment;
        try {
          assessment = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        } catch {
          assessment = { overall_score: 50, verdict: "CAUTION", risk_factors: [], recommendations: [] };
        }

        // Store scan
        await supabaseClient.from("scans").insert({
          user_id: profile.user_id,
          overall_score: assessment.overall_score,
          verdict: assessment.verdict,
          risk_breakdown: assessment.risk_factors,
          alternatives: [],
        });

        return new Response(
          JSON.stringify({ success: true, data: assessment }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
        // Get user's scan statistics
        const { data: scans } = await supabaseClient
          .from("scans")
          .select("overall_score, verdict, created_at")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false })
          .limit(100);

        const stats = {
          total_scans: scans?.length || 0,
          average_score: scans?.length 
            ? Math.round(scans.reduce((acc, s) => acc + s.overall_score, 0) / scans.length) 
            : 0,
          safe_count: scans?.filter(s => s.verdict === "SAFE").length || 0,
          caution_count: scans?.filter(s => s.verdict === "CAUTION").length || 0,
          danger_count: scans?.filter(s => s.verdict === "DANGER").length || 0,
        };

        return new Response(
          JSON.stringify({ success: true, data: stats }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "usage": {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              calls_today: profile.api_calls_today + 1,
              daily_limit: 100,
              remaining: 100 - profile.api_calls_today - 1,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown endpoint: ${endpoint}. Available: scan, stats, usage`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
