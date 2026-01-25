import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
const requestSchema = z.object({
  url: z.string().url().max(2048),
});

// Known phishing/scam indicators
const SUSPICIOUS_PATTERNS = {
  domains: [
    /bit\.ly/i, /tinyurl\.com/i, /goo\.gl/i, /t\.co/i, /ow\.ly/i,
    /is\.gd/i, /buff\.ly/i, /adf\.ly/i, /clck\.ru/i,
  ],
  keywords: [
    "free-money", "claim-prize", "winner", "lottery", "bitcoin-giveaway",
    "password-reset", "account-suspended", "verify-now", "urgent-action",
    "limited-time", "act-now", "congratulations", "selected-winner",
  ],
  typosquatting: [
    /faceb00k/i, /gooogle/i, /amaz0n/i, /paypa1/i, /netf1ix/i,
    /micros0ft/i, /app1e/i, /twltter/i, /1nstagram/i, /wh4tsapp/i,
  ],
  tlds: [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".work", ".click", ".loan"],
};

// Known legitimate domains in Kenya
const TRUSTED_DOMAINS = [
  "safaricom.co.ke", "mpesa.co.ke", "jumia.co.ke", "kilimall.co.ke",
  "nation.co.ke", "standardmedia.co.ke", "kra.go.ke", "ecitizen.go.ke",
  "google.com", "microsoft.com", "apple.com", "amazon.com", "facebook.com",
  "twitter.com", "instagram.com", "linkedin.com", "youtube.com", "github.com",
  "whatsapp.com", "telegram.org", "netflix.com", "spotify.com",
];

interface VirusTotalResult {
  positives: number;
  total: number;
  scanDate: string;
  permalink: string;
  categories: string[];
  detectedBy: string[];
}

interface AIAnalysisResult {
  model: string;
  analysis: string;
  threats: string[];
  recommendations: string[];
}

interface LinkAnalysis {
  url: string;
  overall_score: number;
  verdict: "safe" | "caution" | "dangerous";
  risk_level: "low" | "medium" | "high" | "critical";
  link_type: string;
  domain_info: {
    domain: string;
    is_trusted: boolean;
    is_shortened: boolean;
    suspicious_tld: boolean;
    age_indicator: string;
  };
  threats_detected: string[];
  ai_analysis: string;
  recommendations: string[];
  kenyan_context: string[];
  virustotal_result?: VirusTotalResult;
  multi_ai_analysis?: AIAnalysisResult[];
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function checkSuspiciousPatterns(url: string, domain: string): string[] {
  const threats: string[] = [];
  const urlLower = url.toLowerCase();
  const domainLower = domain.toLowerCase();

  for (const pattern of SUSPICIOUS_PATTERNS.domains) {
    if (pattern.test(domainLower)) {
      threats.push("URL shortener detected - may hide malicious destination");
      break;
    }
  }

  for (const keyword of SUSPICIOUS_PATTERNS.keywords) {
    if (urlLower.includes(keyword)) {
      threats.push(`Suspicious keyword detected: "${keyword}"`);
    }
  }

  for (const pattern of SUSPICIOUS_PATTERNS.typosquatting) {
    if (pattern.test(domainLower)) {
      threats.push("Possible typosquatting attack - domain mimics trusted site");
      break;
    }
  }

  for (const tld of SUSPICIOUS_PATTERNS.tlds) {
    if (domainLower.endsWith(tld)) {
      threats.push(`High-risk domain extension (${tld}) commonly used in scams`);
      break;
    }
  }

  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    threats.push("IP address used instead of domain name - highly suspicious");
  }

  const subdomainCount = domain.split(".").length - 2;
  if (subdomainCount > 2) {
    threats.push("Excessive subdomains - potential phishing attempt");
  }

  if (/[0-9]/.test(domain) && !TRUSTED_DOMAINS.some(td => domain.includes(td))) {
    const hasLetterReplacement = /[01l][i1l]|[0o]|[3e]|[4a]|[5s]|[7t]|[8b]|[9g]/i.test(domain);
    if (hasLetterReplacement) {
      threats.push("Numbers replacing letters in domain - possible phishing");
    }
  }

  return threats;
}

function isTrustedDomain(domain: string): boolean {
  return TRUSTED_DOMAINS.some(td => domain === td || domain.endsWith(`.${td}`));
}

function checkKenyanContext(url: string, domain: string): string[] {
  const insights: string[] = [];
  const urlLower = url.toLowerCase();

  if (urlLower.includes("mpesa") || urlLower.includes("m-pesa")) {
    if (!domain.includes("safaricom.co.ke") && !domain.includes("mpesa.co.ke")) {
      insights.push("⚠️ Claims to be M-Pesa but not from official Safaricom domain");
      insights.push("Official M-Pesa links only come from safaricom.co.ke or mpesa.co.ke");
    }
  }

  if (urlLower.includes("kra") || urlLower.includes("itax")) {
    if (!domain.endsWith(".go.ke")) {
      insights.push("⚠️ Claims to be KRA but not a .go.ke government domain");
      insights.push("All official KRA links use kra.go.ke");
    }
  }

  const bankPatterns = ["equity", "kcb", "coop", "stanbic", "barclays", "absa", "ncba"];
  for (const bank of bankPatterns) {
    if (urlLower.includes(bank) && !domain.includes(bank)) {
      insights.push(`⚠️ Mentions ${bank.toUpperCase()} but domain doesn't match official bank website`);
    }
  }

  if (urlLower.includes("jumia") && !domain.includes("jumia.co.ke")) {
    insights.push("⚠️ Claims to be Jumia but not from official jumia.co.ke domain");
  }

  if (urlLower.includes("kilimall") && !domain.includes("kilimall.co.ke")) {
    insights.push("⚠️ Claims to be Kilimall but not from official kilimall.co.ke domain");
  }

  if (urlLower.includes("wa.me") || urlLower.includes("chat.whatsapp.com")) {
    insights.push("📱 WhatsApp link detected - verify sender before clicking");
    insights.push("Never share personal info or M-Pesa PINs via WhatsApp");
  }

  if (urlLower.includes("registration-fee") || urlLower.includes("registration_fee")) {
    insights.push("🚨 Mentions registration fee - common scam tactic in Kenya");
  }

  if (urlLower.includes("processing-fee") || urlLower.includes("unlock-funds")) {
    insights.push("🚨 Advance fee scam indicator - never pay to receive money");
  }

  return insights;
}

// VirusTotal API integration
async function checkVirusTotal(url: string): Promise<VirusTotalResult | null> {
  const VIRUSTOTAL_API_KEY = Deno.env.get("VIRUSTOTAL_API_KEY");
  
  if (!VIRUSTOTAL_API_KEY) {
    console.log("VirusTotal API key not configured");
    return null;
  }

  try {
    // First, submit URL for scanning
    const scanResponse = await fetch("https://www.virustotal.com/vtapi/v2/url/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `apikey=${VIRUSTOTAL_API_KEY}&url=${encodeURIComponent(url)}`,
    });

    if (!scanResponse.ok) {
      console.error("VirusTotal scan request failed:", scanResponse.status);
      return null;
    }

    // Wait a moment for scan to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the report
    const reportResponse = await fetch(
      `https://www.virustotal.com/vtapi/v2/url/report?apikey=${VIRUSTOTAL_API_KEY}&resource=${encodeURIComponent(url)}`,
      { method: "GET" }
    );

    if (!reportResponse.ok) {
      console.error("VirusTotal report request failed:", reportResponse.status);
      return null;
    }

    const report = await reportResponse.json();
    
    if (report.response_code !== 1) {
      console.log("VirusTotal: URL not yet scanned or no data");
      return null;
    }

    const detectedBy: string[] = [];
    if (report.scans) {
      for (const [scanner, result] of Object.entries(report.scans)) {
        if ((result as any).detected) {
          detectedBy.push(scanner);
        }
      }
    }

    return {
      positives: report.positives || 0,
      total: report.total || 0,
      scanDate: report.scan_date || new Date().toISOString(),
      permalink: report.permalink || "",
      categories: report.categories || [],
      detectedBy,
    };
  } catch (error) {
    console.error("VirusTotal API error:", error);
    return null;
  }
}

// Multi-AI analysis using different models
async function getMultiAIAnalysis(url: string, domain: string, isTrusted: boolean, threats: string[]): Promise<AIAnalysisResult[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const results: AIAnalysisResult[] = [];

  if (!LOVABLE_API_KEY) {
    return results;
  }

  const systemPrompt = `You are a cybersecurity expert specializing in link analysis and phishing detection for the Kenyan market. Analyze URLs for potential threats including:
- Phishing attempts
- Scam websites
- Malware distribution
- Fake login pages
- Advance fee fraud (common in Kenya)
- Impersonation of Kenyan services (M-Pesa, Safaricom, KRA, Banks)

Respond in JSON format with:
{
  "link_type": "e-commerce|social_media|banking|government|news|file_download|redirect|unknown",
  "analysis": "Brief 2-3 sentence analysis of the link's safety",
  "additional_threats": ["array of any additional threats detected"],
  "recommendations": ["array of safety recommendations"],
  "history": "Brief history/background about this domain or type of link if known"
}`;

  const userPrompt = `Analyze this URL for security risks: ${url}

Domain: ${domain}
Is trusted domain: ${isTrusted}
Detected threats so far: ${threats.join(", ") || "None"}

Provide comprehensive analysis including any known history about this domain or similar scam patterns.`;

  // Models to use for analysis
  const models = [
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash" },
    { id: "openai/gpt-5-mini", name: "GPT-5 Mini" },
  ];

  const analysisPromises = models.map(async (model) => {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error(`${model.name} analysis failed:`, response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            model: model.name,
            analysis: parsed.analysis || "",
            threats: parsed.additional_threats || [],
            recommendations: parsed.recommendations || [],
          };
        }
      } catch {
        return {
          model: model.name,
          analysis: content.slice(0, 500),
          threats: [],
          recommendations: [],
        };
      }
    } catch (error) {
      console.error(`${model.name} error:`, error);
      return null;
    }
    return null;
  });

  const analysisResults = await Promise.all(analysisPromises);
  return analysisResults.filter((r): r is AIAnalysisResult => r !== null);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid URL format",
          details: validationResult.error.issues.map(i => i.message)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = validationResult.data;
    const domain = extractDomain(url);

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Could not parse URL domain" }),
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

    // Check scan limits for free users (skip for admin)
    let scansUsed = 0;
    let scanLimit = 3;
    
    if (userProfile && !userProfile.premium && !isAdmin) {
      scanLimit = userProfile.scan_limit || 3;
      scansUsed = userProfile.scans_today || 0;
      
      if (scansUsed >= scanLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Scan limit reached. Upgrade to premium for unlimited scans!",
            limitReached: true
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      scansUsed += 1;
      await supabase
        .from("profiles")
        .update({ scans_today: scansUsed })
        .eq("user_id", userId);
    }

    // Perform static analysis
    const threats = checkSuspiciousPatterns(url, domain);
    const kenyanContext = checkKenyanContext(url, domain);
    const isTrusted = isTrustedDomain(domain);
    const isShortened = SUSPICIOUS_PATTERNS.domains.some(p => p.test(domain));
    const hasSuspiciousTld = SUSPICIOUS_PATTERNS.tlds.some(tld => domain.endsWith(tld));

    // Run VirusTotal and Multi-AI analysis in parallel
    const [virusTotalResult, multiAIResults] = await Promise.all([
      checkVirusTotal(url),
      getMultiAIAnalysis(url, domain, isTrusted, threats),
    ]);

    // Add VirusTotal threats
    if (virusTotalResult && virusTotalResult.positives > 0) {
      threats.push(`VirusTotal: ${virusTotalResult.positives}/${virusTotalResult.total} security vendors flagged this URL`);
      if (virusTotalResult.detectedBy.length > 0) {
        threats.push(`Detected by: ${virusTotalResult.detectedBy.slice(0, 5).join(", ")}${virusTotalResult.detectedBy.length > 5 ? ` and ${virusTotalResult.detectedBy.length - 5} more` : ""}`);
      }
    }

    // Aggregate AI analysis
    let combinedAIAnalysis = "";
    let linkType = "Unknown";
    
    for (const aiResult of multiAIResults) {
      if (aiResult.analysis) {
        combinedAIAnalysis += `[${aiResult.model}]: ${aiResult.analysis}\n`;
      }
      if (aiResult.threats && aiResult.threats.length > 0) {
        threats.push(...aiResult.threats);
      }
    }

    if (multiAIResults.length > 0 && multiAIResults[0]) {
      linkType = "analyzed";
    }

    // Calculate overall score
    let score = 100;
    
    // Deductions based on threats
    score -= threats.length * 10;
    
    // VirusTotal deductions
    if (virusTotalResult) {
      if (virusTotalResult.positives > 0) {
        score -= virusTotalResult.positives * 5;
      }
    }
    
    // Deductions based on risk factors
    if (isShortened) score -= 20;
    if (hasSuspiciousTld) score -= 25;
    if (!isTrusted) score -= 10;
    if (kenyanContext.some(c => c.includes("⚠️"))) score -= 15;
    if (kenyanContext.some(c => c.includes("🚨"))) score -= 25;
    
    // Bonus for trusted domains
    if (isTrusted) score += 20;
    
    // Bonus for clean VirusTotal
    if (virusTotalResult && virusTotalResult.positives === 0 && virusTotalResult.total > 0) {
      score += 10;
    }
    
    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine verdict and risk level
    let verdict: "safe" | "caution" | "dangerous";
    let riskLevel: "low" | "medium" | "high" | "critical";

    if (score >= 80) {
      verdict = "safe";
      riskLevel = "low";
    } else if (score >= 60) {
      verdict = "caution";
      riskLevel = "medium";
    } else if (score >= 40) {
      verdict = "caution";
      riskLevel = "high";
    } else {
      verdict = "dangerous";
      riskLevel = "critical";
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (threats.length > 0) {
      recommendations.push("Avoid clicking this link or providing any personal information");
    }
    
    if (isShortened) {
      recommendations.push("Use a URL expander service to reveal the actual destination");
    }
    
    if (virusTotalResult && virusTotalResult.positives > 0) {
      recommendations.push(`This URL was flagged by ${virusTotalResult.positives} security vendors - exercise extreme caution`);
    }
    
    if (verdict === "dangerous") {
      recommendations.push("Report this link to relevant authorities if received via SMS or email");
      recommendations.push("Block the sender if this was sent to you directly");
    }
    
    if (verdict === "caution") {
      recommendations.push("Verify the link through official channels before clicking");
      recommendations.push("Never enter passwords or M-Pesa PINs on unfamiliar sites");
    }
    
    if (verdict === "safe") {
      recommendations.push("Always double-check the URL before entering sensitive information");
    }

    // Add AI recommendations
    for (const aiResult of multiAIResults) {
      if (aiResult.recommendations) {
        recommendations.push(...aiResult.recommendations);
      }
    }

    const analysis: LinkAnalysis = {
      url,
      overall_score: score,
      verdict,
      risk_level: riskLevel,
      link_type: linkType,
      domain_info: {
        domain,
        is_trusted: isTrusted,
        is_shortened: isShortened,
        suspicious_tld: hasSuspiciousTld,
        age_indicator: isTrusted ? "Established" : "Unknown",
      },
      threats_detected: [...new Set(threats)],
      ai_analysis: combinedAIAnalysis || "Multi-AI analysis completed. Showing combined results.",
      recommendations: [...new Set(recommendations)],
      kenyan_context: kenyanContext,
      virustotal_result: virusTotalResult || undefined,
      multi_ai_analysis: multiAIResults.length > 0 ? multiAIResults : undefined,
    };

    // Store the link scan
    await supabase.from("scans").insert({
      user_id: userId,
      overall_score: score,
      verdict,
      risk_breakdown: {
        type: "link_analysis",
        threats_detected: analysis.threats_detected,
        domain_info: analysis.domain_info,
        kenyan_context: analysis.kenyan_context,
        virustotal: virusTotalResult,
        multi_ai: multiAIResults,
      },
      alternatives: [],
      is_guest: !userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        scansUsed: userProfile && !userProfile.premium && !isAdmin ? scansUsed : null,
        scanLimit: userProfile && !userProfile.premium && !isAdmin ? scanLimit : null,
        isPremium: userProfile?.premium || isAdmin || false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-link:", error);
    return new Response(
      JSON.stringify({ error: "Unable to analyze link. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
