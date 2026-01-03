import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanSummaryRequest {
  userId: string;
  email: string;
  scanResult: {
    overallScore: number;
    verdict: string;
    riskBreakdown: {
      vendorTrust: number;
      productAuthenticity: number;
      supplyChainRisk: number;
      priceAnomaly: number;
    };
    alternatives?: string[];
  };
  scansRemaining: number;
  productName?: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
};

const getScoreBadge = (score: number): string => {
  if (score >= 70) return "✅ SAFE";
  if (score >= 40) return "⚠️ CAUTION";
  return "🚨 RISKY";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, scanResult, scansRemaining, productName }: ScanSummaryRequest = await req.json();
    console.log("[SCAN-SUMMARY] Sending to:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check user email preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_preferences, premium")
      .eq("user_id", userId)
      .single();

    if (!profile?.email_preferences?.scan_summary) {
      console.log("[SCAN-SUMMARY] User opted out of scan summary emails");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const scoreColor = getScoreColor(scanResult.overallScore);
    const scoreBadge = getScoreBadge(scanResult.overallScore);
    const progressWidth = scanResult.overallScore;

    const emailResponse = await resend.emails.send({
      from: "Safe Bazaar AI <onboarding@resend.dev>",
      to: [email],
      subject: `Scan Results: ${scoreBadge} - ${productName || "Product"} (${scanResult.overallScore}/100)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #006600 0%, #004400 100%); padding: 30px 40px;">
                      <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🛡️ Your Scan Results Are Ready!</h1>
                      <p style="color: #90EE90; font-size: 14px; margin: 10px 0 0;">${productName || "Product Analysis"}</p>
                    </td>
                  </tr>
                  
                  <!-- Score Section -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <div style="text-align: center; background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 18px; margin: 0 0 15px;">Safety Score</h2>
                        <div style="font-size: 48px; font-weight: bold; color: ${scoreColor}; margin-bottom: 10px;">
                          ${scanResult.overallScore}
                        </div>
                        <div style="background: #e5e7eb; border-radius: 10px; height: 12px; overflow: hidden; margin-bottom: 15px;">
                          <div style="background: ${scoreColor}; height: 100%; width: ${progressWidth}%; border-radius: 10px;"></div>
                        </div>
                        <span style="display: inline-block; background: ${scoreColor}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                          ${scoreBadge}
                        </span>
                      </div>
                      
                      <!-- Risk Breakdown -->
                      <h3 style="color: #333333; font-size: 16px; margin: 0 0 15px;">📊 Risk Breakdown</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 10px; background: #f8f9fa; border-radius: 8px 8px 0 0;">
                            <span style="color: #666666;">Vendor Trust</span>
                            <span style="float: right; font-weight: bold; color: ${getScoreColor(scanResult.riskBreakdown.vendorTrust)};">${scanResult.riskBreakdown.vendorTrust}/100</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; background: #ffffff;">
                            <span style="color: #666666;">Product Authenticity</span>
                            <span style="float: right; font-weight: bold; color: ${getScoreColor(scanResult.riskBreakdown.productAuthenticity)};">${scanResult.riskBreakdown.productAuthenticity}/100</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; background: #f8f9fa;">
                            <span style="color: #666666;">Supply Chain</span>
                            <span style="float: right; font-weight: bold; color: ${getScoreColor(100 - scanResult.riskBreakdown.supplyChainRisk)};">${100 - scanResult.riskBreakdown.supplyChainRisk}/100</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; background: #ffffff; border-radius: 0 0 8px 8px;">
                            <span style="color: #666666;">Price Analysis</span>
                            <span style="float: right; font-weight: bold; color: ${getScoreColor(100 - scanResult.riskBreakdown.priceAnomaly)};">${100 - scanResult.riskBreakdown.priceAnomaly}/100</span>
                          </td>
                        </tr>
                      </table>

                      ${scanResult.alternatives && scanResult.alternatives.length > 0 ? `
                      <!-- Alternatives -->
                      <div style="background: #f0fff0; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <h4 style="color: #22c55e; margin: 0 0 10px;">🏪 Safer Alternatives</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 14px;">
                          ${scanResult.alternatives.map(alt => `<li>${alt}</li>`).join('')}
                        </ul>
                      </div>
                      ` : ''}

                      <!-- Scans Remaining -->
                      <div style="background: ${scansRemaining <= 1 ? '#fef3c7' : '#f0f9ff'}; border-radius: 8px; padding: 15px; text-align: center; margin-top: 20px;">
                        <p style="margin: 0; color: ${scansRemaining <= 1 ? '#92400e' : '#0369a1'}; font-size: 14px;">
                          ${scansRemaining <= 1 ? '⚠️' : '📊'} Scans remaining today: <strong>${scansRemaining}</strong>
                        </p>
                      </div>

                      ${!profile?.premium ? `
                      <!-- Premium CTA -->
                      <div style="text-align: center; margin-top: 25px;">
                        <a href="https://safe-bazaar-ai.lovable.app/premium" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                          ⭐ Upgrade to Premium - Unlimited Scans
                        </a>
                      </div>
                      ` : ''}
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8f9fa; padding: 20px 40px; text-align: center;">
                      <p style="color: #666666; font-size: 12px; margin: 0;">
                        🇰🇪 Safe Bazaar AI - Shop Safe in Kenya
                      </p>
                      <p style="color: #999999; font-size: 11px; margin: 10px 0 0;">
                        <a href="https://safe-bazaar-ai.lovable.app" style="color: #006600; text-decoration: none;">View Full Report</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("[SCAN-SUMMARY] Sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[SCAN-SUMMARY] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
