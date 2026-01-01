import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supported AI models
const AI_MODELS = {
  gemini: {
    name: "google/gemini-2.5-flash",
    endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    useGateway: true,
  },
  grok: {
    name: "grok-3",
    endpoint: "https://api.x.ai/v1/chat/completions",
    useGateway: false,
  },
};

// Input validation schema
const productInfoSchema = z.object({
  name: z.string().max(200).optional(),
  vendor: z.string().max(100).optional(),
  price: z.number().positive().optional(),
  platform: z.enum(["Jumia", "Kilimall", "Facebook Marketplace", "Manual Upload", "Other"]).optional(),
}).optional();

const requestSchema = z.object({
  imageUrl: z.string().url().max(2048).optional(),
  productInfo: productInfoSchema,
  model: z.enum(["gemini", "grok"]).optional().default("gemini"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { imageUrl, productInfo, model: selectedModel } = validationResult.data;
    
    // Get API keys
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    
    // Determine which model to use
    let modelConfig = AI_MODELS[selectedModel || "gemini"];
    let apiKey = LOVABLE_API_KEY;
    
    // If Grok is selected but no API key, fall back to Gemini
    if (selectedModel === "grok") {
      if (XAI_API_KEY) {
        apiKey = XAI_API_KEY;
      } else {
        console.log("XAI_API_KEY not configured, falling back to Gemini");
        modelConfig = AI_MODELS.gemini;
        apiKey = LOVABLE_API_KEY;
      }
    }
    
    if (!apiKey) {
      throw new Error("No AI API key configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user if authenticated
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    let userProfile = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        userProfile = profile;
      }
    }

    // Check scan limits for free users
    if (userProfile && !userProfile.premium) {
      if (userProfile.scans_today >= userProfile.scan_limit) {
        return new Response(
          JSON.stringify({ error: "Scan limit reached. Upgrade to premium for unlimited scans!" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Increment scan count
      await supabase
        .from("profiles")
        .update({ scans_today: userProfile.scans_today + 1 })
        .eq("user_id", userId);
    }

    // Prepare AI prompt for risk assessment
    const systemPrompt = `You are a fraud detection AI for Kenyan e-commerce. Analyze products for:
1. Vendor Trust (40%): Check reviews sentiment, account age indicators
2. Product Authenticity (30%): Analyze image quality, branding consistency
3. Supply Chain & Payment (20%): M-Pesa safety, geo-risk factors
4. Price Analysis (10%): Compare to market averages

Provide Kenyan-specific insights considering platforms like Jumia, Kilimall, and local vendors.
Return a JSON response with:
- overall_score (0-100)
- verdict ("safe", "caution", "unsafe")
- risk_factors array with: name, score (0-100), weight, details
- safer_alternatives array with: name, platform, price, trust_score, reason`;

    const userPrompt = `Analyze this product:
${productInfo ? `Product: ${JSON.stringify(productInfo)}` : ''}
Image URL: ${imageUrl || 'No image provided'}

Consider Kenyan market context: counterfeit electronics, unverified M-Pesa transactions, high-risk vendor locations.`;

    console.log(`Using AI model: ${modelConfig.name}`);

    // Call AI API
    const aiResponse = await fetch(modelConfig.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI error (${modelConfig.name}):`, aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse AI response
    let assessment;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : generateFallbackAssessment();
    } catch {
      assessment = generateFallbackAssessment();
    }

    // Store product and scan
    const { data: product } = await supabase
      .from("products")
      .insert({
        vendor_name: productInfo?.vendor || "Unknown",
        product_name: productInfo?.name || "Scanned Product",
        price: productInfo?.price || null,
        image_url: imageUrl,
        source_platform: productInfo?.platform || "Manual Upload",
        authenticity_score: assessment.overall_score,
      })
      .select()
      .single();

    await supabase
      .from("scans")
      .insert({
        user_id: userId,
        product_id: product?.id,
        overall_score: assessment.overall_score,
        verdict: assessment.verdict,
        risk_breakdown: assessment.risk_factors,
        alternatives: assessment.safer_alternatives,
        is_guest: !userId,
      });

    return new Response(
      JSON.stringify({
        success: true,
        assessment,
        modelUsed: modelConfig.name,
        scansRemaining: userProfile && !userProfile.premium 
          ? userProfile.scan_limit - (userProfile.scans_today + 1)
          : null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in assess-risk:", error);
    return new Response(
      JSON.stringify({ error: "Unable to process scan. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackAssessment() {
  return {
    overall_score: 45,
    verdict: "caution",
    risk_factors: [
      {
        name: "Vendor Trust Score",
        score: 40,
        weight: 40,
        details: "Limited vendor history available. Proceed with caution."
      },
      {
        name: "Product Authenticity",
        score: 55,
        weight: 30,
        details: "Unable to verify product authenticity from image."
      },
      {
        name: "Supply Chain & Payment",
        score: 45,
        weight: 20,
        details: "Payment method and supply chain not verified."
      },
      {
        name: "Price Analysis",
        score: 60,
        weight: 10,
        details: "Price within normal market range."
      }
    ],
    safer_alternatives: [
      {
        name: "Verified Jumia Seller",
        platform: "Jumia Kenya",
        price: "+15% premium",
        trust_score: 85,
        reason: "Established vendor with verified reviews"
      }
    ]
  };
}