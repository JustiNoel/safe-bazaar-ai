import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageAnalysisResult {
  verdict: "legitimate" | "suspicious" | "cloned" | "fake";
  confidence: number;
  analysis: string;
  threats: string[];
  recommendations: string[];
  source_check: {
    is_stock_image: boolean;
    possible_sources: string[];
    manipulation_detected: boolean;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl } = await req.json();

    if (!imageData && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image data or URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase
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

    // Check if admin (bypass limits)
    const isAdmin = userProfile?.is_admin || userProfile?.admin_bypass_limits;
    const isPremium = userProfile?.premium || userProfile?.subscription_tier === "premium" || userProfile?.subscription_tier === "premium_seller";

    // Check scan limits for free users
    if (userProfile && !isPremium && !isAdmin) {
      const scanLimit = userProfile.scan_limit || 3;
      const scansUsed = userProfile.scans_today || 0;
      
      if (scansUsed >= scanLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Scan limit reached. Upgrade to premium for unlimited scans!",
            limitReached: true
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("profiles")
        .update({ scans_today: scansUsed + 1 })
        .eq("user_id", userId);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze image using AI with vision capabilities
    const systemPrompt = `You are an expert image forensics analyst specializing in detecting fake, cloned, or manipulated images, particularly in the context of e-commerce and online marketplaces in Kenya.

Analyze the provided image and determine:
1. Whether it appears to be an original photo or copied/cloned from elsewhere
2. Signs of image manipulation (photoshopping, editing, AI generation)
3. Whether it looks like a stock image or professional product photo used without permission
4. Any red flags that suggest fraudulent intent

Respond in JSON format:
{
  "verdict": "legitimate|suspicious|cloned|fake",
  "confidence": 0-100,
  "analysis": "Detailed analysis of the image",
  "threats": ["Array of specific concerns found"],
  "recommendations": ["Array of safety recommendations"],
  "source_check": {
    "is_stock_image": boolean,
    "possible_sources": ["Possible original sources if detected"],
    "manipulation_detected": boolean
  },
  "kenyan_context": "Any specific warnings for Kenyan buyers"
}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageData) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image for authenticity. Check if it's original, cloned, manipulated, or a stock photo being misused."
          },
          {
            type: "image_url",
            image_url: {
              url: imageData.startsWith("data:") ? imageData : `data:image/jpeg;base64,${imageData}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image for authenticity. Check if it's original, cloned, manipulated, or a stock photo being misused. Image URL: ${imageUrl}`
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    
    let analysis: ImageAnalysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = {
          verdict: "suspicious",
          confidence: 50,
          analysis: content,
          threats: ["Could not perform full analysis"],
          recommendations: ["Proceed with caution", "Request more product photos from seller"],
          source_check: {
            is_stock_image: false,
            possible_sources: [],
            manipulation_detected: false
          }
        };
      }
    } catch {
      analysis = {
        verdict: "suspicious",
        confidence: 50,
        analysis: content,
        threats: ["Analysis parsing error"],
        recommendations: ["Proceed with caution"],
        source_check: {
          is_stock_image: false,
          possible_sources: [],
          manipulation_detected: false
        }
      };
    }

    // Save scan to database
    if (userId) {
      await supabase.from("scans").insert({
        user_id: userId,
        overall_score: analysis.confidence,
        verdict: analysis.verdict,
        risk_breakdown: {
          type: "image_analysis",
          ...analysis
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        isPremium: isPremium || isAdmin
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Image analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
