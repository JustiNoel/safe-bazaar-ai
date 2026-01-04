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
  model: z.enum(["gemini", "grok"]).optional().default("grok"),
});

// Helper function to get midnight EAT (East African Time = UTC+3)
function getMidnightEAT(): Date {
  const now = new Date();
  // Get current time in EAT (UTC+3)
  const eatOffset = 3 * 60; // 3 hours in minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const eatTime = new Date(utcTime + (eatOffset * 60000));
  
  // Set to next midnight EAT
  const nextMidnight = new Date(eatTime);
  nextMidnight.setHours(24, 0, 0, 0);
  
  // Convert back to UTC for storage
  const nextMidnightUTC = new Date(nextMidnight.getTime() - (eatOffset * 60000));
  return nextMidnightUTC;
}

// Helper function to check if reset is needed (past midnight EAT)
function shouldResetScans(lastReset: string | null): boolean {
  if (!lastReset) return true;
  
  const lastResetDate = new Date(lastReset);
  const now = new Date();
  
  // Get current time in EAT
  const eatOffset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const nowEAT = new Date(now.getTime() + eatOffset);
  const lastResetEAT = new Date(lastResetDate.getTime() + eatOffset);
  
  // Check if it's a new day in EAT
  return nowEAT.toDateString() !== lastResetEAT.toDateString();
}

// Helper function to get next reset time formatted for EAT
function getNextResetTimeEAT(): string {
  return "12:00 AM EAT";
}

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
    
    // Determine which model to use - Default to Grok (xAI)
    let modelConfig = AI_MODELS.grok;
    let apiKey = XAI_API_KEY;
    
    // If xAI key not available, fall back to Gemini
    if (!XAI_API_KEY) {
      console.log("XAI_API_KEY not configured, falling back to Gemini");
      modelConfig = AI_MODELS.gemini;
      apiKey = LOVABLE_API_KEY;
    } else if (selectedModel === "gemini") {
      // Only use Gemini if explicitly requested
      modelConfig = AI_MODELS.gemini;
      apiKey = LOVABLE_API_KEY;
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
    let scansUsed = 0;
    let scanLimit = 3;
    const nextResetTime = getNextResetTimeEAT();
    
    if (userProfile && !userProfile.premium) {
      scanLimit = userProfile.scan_limit || 3;
      
      // Check if we need to reset scans (past midnight EAT)
      if (shouldResetScans(userProfile.last_scan_reset)) {
        console.log("Resetting daily scans - new day in EAT timezone");
        await supabase
          .from("profiles")
          .update({ 
            scans_today: 0, 
            last_scan_reset: new Date().toISOString() 
          })
          .eq("user_id", userId);
        scansUsed = 0;
      } else {
        scansUsed = userProfile.scans_today || 0;
      }
      
      // Check if limit reached BEFORE performing scan
      if (scansUsed >= scanLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Scan limit reached. Upgrade to premium for unlimited scans!",
            scansUsed: scansUsed,
            scanLimit: scanLimit,
            nextResetTime: nextResetTime,
            limitReached: true
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Increment scan count
      scansUsed += 1;
      await supabase
        .from("profiles")
        .update({ scans_today: scansUsed })
        .eq("user_id", userId);
    } else if (userProfile && userProfile.premium) {
      // Premium users have unlimited scans
      scanLimit = -1; // -1 means unlimited
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

    // Function to call AI API with fallback
    const callAI = async (config: typeof modelConfig, key: string): Promise<any> => {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.name,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });
      return response;
    };

    let aiResponse = await callAI(modelConfig, apiKey!);

    // If primary model fails (403/402/429), try fallback to Gemini
    if (!aiResponse.ok && modelConfig.name !== AI_MODELS.gemini.name && LOVABLE_API_KEY) {
      const errorText = await aiResponse.text();
      console.warn(`Primary AI (${modelConfig.name}) failed: ${aiResponse.status} - ${errorText}`);
      console.log("Falling back to Gemini via Lovable AI Gateway...");
      
      modelConfig = AI_MODELS.gemini;
      apiKey = LOVABLE_API_KEY;
      aiResponse = await callAI(modelConfig, apiKey);
    }

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
      
      // Use fallback assessment if all AI calls fail
      console.warn("All AI calls failed, using fallback assessment");
      const fallbackAssessment = generateFallbackAssessment();
      
      // Still store the scan with fallback data
      const { data: product } = await supabase
        .from("products")
        .insert({
          vendor_name: productInfo?.vendor || "Unknown",
          product_name: productInfo?.name || "Scanned Product",
          price: productInfo?.price || null,
          image_url: imageUrl,
          source_platform: productInfo?.platform || "Manual Upload",
          authenticity_score: fallbackAssessment.overall_score,
        })
        .select()
        .single();

      await supabase
        .from("scans")
        .insert({
          user_id: userId,
          product_id: product?.id,
          overall_score: fallbackAssessment.overall_score,
          verdict: fallbackAssessment.verdict,
          risk_breakdown: fallbackAssessment.risk_factors,
          alternatives: fallbackAssessment.safer_alternatives,
          is_guest: !userId,
        });

      return new Response(
        JSON.stringify({
          success: true,
          assessment: fallbackAssessment,
          modelUsed: "fallback",
          scansUsed: userProfile && !userProfile.premium ? scansUsed : null,
          scanLimit: userProfile && !userProfile.premium ? scanLimit : null,
          scansRemaining: userProfile && !userProfile.premium ? scanLimit - scansUsed : null,
          nextResetTime: userProfile && !userProfile.premium ? nextResetTime : null,
          isPremium: userProfile?.premium || false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        scansUsed: userProfile && !userProfile.premium ? scansUsed : null,
        scanLimit: userProfile && !userProfile.premium ? scanLimit : null,
        scansRemaining: userProfile && !userProfile.premium ? scanLimit - scansUsed : null,
        nextResetTime: userProfile && !userProfile.premium ? nextResetTime : null,
        isPremium: userProfile?.premium || false
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