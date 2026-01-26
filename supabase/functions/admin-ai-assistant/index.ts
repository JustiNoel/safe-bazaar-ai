import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, admin_bypass_limits")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to verify admin status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = profile?.is_admin || profile?.admin_bypass_limits;

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required", code: "ADMIN_REQUIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, context } = await req.json() as { messages: ChatMessage[], context?: string };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch platform statistics for context
    const [usersResult, scansResult, sellersResult] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact" }),
      supabase.from("scans").select("*", { count: "exact" }).limit(100),
      supabase.from("profiles").select("*").eq("role", "seller").limit(50),
    ]);

    const stats = {
      totalUsers: usersResult.count || 0,
      recentScans: scansResult.data?.length || 0,
      sellers: sellersResult.data?.length || 0,
    };

    const systemPrompt = `You are the SafeBazaar Admin AI Assistant, an expert system designed to help platform administrators manage the e-commerce safety platform. You have UNLIMITED access and capabilities for admin users.

PLATFORM CONTEXT:
- Total Users: ${stats.totalUsers}
- Recent Scans: ${stats.recentScans}
- Registered Sellers: ${stats.sellers}
- Current Admin Context: ${context || "general"}

YOUR CAPABILITIES:
1. USER ANALYSIS: Provide insights on user behavior, identify suspicious patterns, recommend actions for problematic accounts
2. SELLER MANAGEMENT: Analyze seller trust scores, recommend verification priorities, identify potentially fraudulent sellers
3. SCAM INTELLIGENCE: Provide insights on emerging scam patterns in Kenya, analyze link analysis results, recommend platform-wide security measures
4. PLATFORM HEALTH: Analyze platform metrics, suggest improvements, identify areas of concern
5. COMPLIANCE: Help with KYC requirements, regulatory compliance, data protection advice

KENYAN MARKET EXPERTISE:
- M-Pesa payment security and fraud patterns
- Common scam tactics in Kenyan marketplaces (Jumia, Kilimall, OLX)
- Regional fraud hotspots and patterns
- Local regulatory requirements

RESPONSE GUIDELINES:
- Be direct and actionable
- Provide specific recommendations when possible
- Use data-driven insights
- Flag urgent security concerns prominently
- Consider Kenyan context in all recommendations
- Use KES for any monetary references`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Admin AI assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
