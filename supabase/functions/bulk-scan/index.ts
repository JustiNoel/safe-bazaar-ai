import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[BULK-SCAN] ${step}`, details ? JSON.stringify(details) : "");
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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    logStep("User authenticated", { userId: user.id });

    // Check if user is premium seller
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_tier, premium")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (profile.subscription_tier !== "premium_seller") {
      throw new Error("Bulk scanning is only available for Premium Seller subscribers");
    }

    logStep("Premium seller verified");

    const { products } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error("Products array is required");
    }

    if (products.length > 50) {
      throw new Error("Maximum 50 products per batch");
    }

    logStep("Processing batch", { count: products.length });

    const xaiApiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiApiKey) {
      throw new Error("AI service not configured");
    }

    const results = [];

    for (const product of products) {
      try {
        const { name, price, imageUrl, description } = product;
        
        // Call AI for risk assessment
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
                content: `You are a product authenticity and safety analyzer for Kenyan e-commerce. Analyze products and return a JSON object with:
                - overall_score (0-100, higher is safer)
                - verdict (SAFE, CAUTION, or DANGER)
                - risk_factors (array of {name, score, details})
                - recommendations (array of strings)
                Only return valid JSON, no markdown.`
              },
              {
                role: "user",
                content: `Analyze this product for authenticity and safety:
                Name: ${name || "Unknown"}
                Price: ${price || "Not specified"}
                Description: ${description || "No description"}
                ${imageUrl ? `Image: ${imageUrl}` : ""}`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error("AI analysis failed");
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0]?.message?.content || "{}";
        
        let assessment;
        try {
          assessment = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        } catch {
          assessment = {
            overall_score: 50,
            verdict: "CAUTION",
            risk_factors: [],
            recommendations: ["Manual review recommended"],
          };
        }

        results.push({
          product: { name, price, imageUrl },
          success: true,
          assessment,
        });

      } catch (productError) {
        const productErrorMessage = productError instanceof Error ? productError.message : String(productError);
        results.push({
          product: product,
          success: false,
          error: productErrorMessage,
        });
      }
    }

    // Store bulk scan in database
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logStep("Batch completed", { successCount, failCount });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: products.length,
          successful: successCount,
          failed: failCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
