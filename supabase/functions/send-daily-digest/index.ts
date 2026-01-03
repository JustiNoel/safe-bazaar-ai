import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[DAILY-DIGEST] Starting daily digest job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get yesterday's date range (EAT timezone - UTC+3)
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Get all users with daily_digest enabled who had scans yesterday
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email_preferences, scan_limit, bonus_scans, premium")
      .eq("email_preferences->daily_digest", true);

    if (profilesError) {
      throw profilesError;
    }

    console.log(`[DAILY-DIGEST] Found ${profiles?.length || 0} users with daily digest enabled`);

    let emailsSent = 0;
    let errors: string[] = [];

    for (const profile of profiles || []) {
      try {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
        const userEmail = userData?.user?.email;

        if (!userEmail) continue;

        // Get user's scans from yesterday
        const { data: scans, error: scansError } = await supabase
          .from("scans")
          .select("overall_score, verdict, risk_breakdown, created_at")
          .eq("user_id", profile.user_id)
          .gte("created_at", yesterdayStart.toISOString())
          .lte("created_at", yesterdayEnd.toISOString())
          .order("created_at", { ascending: false });

        if (scansError) {
          console.error(`[DAILY-DIGEST] Error fetching scans for ${profile.user_id}:`, scansError);
          continue;
        }

        // Skip if no scans yesterday
        if (!scans || scans.length === 0) {
          console.log(`[DAILY-DIGEST] No scans for ${profile.user_id}, skipping`);
          continue;
        }

        // Calculate stats
        const totalScans = scans.length;
        const avgScore = Math.round(scans.reduce((sum, s) => sum + s.overall_score, 0) / totalScans);
        const safeScans = scans.filter(s => s.overall_score >= 70).length;
        const riskyScans = scans.filter(s => s.overall_score < 40).length;
        const highestScore = Math.max(...scans.map(s => s.overall_score));
        const lowestScore = Math.min(...scans.map(s => s.overall_score));

        const getScoreColor = (score: number): string => {
          if (score >= 70) return "#22c55e";
          if (score >= 40) return "#f59e0b";
          return "#ef4444";
        };

        await resend.emails.send({
          from: "Safe Bazaar AI <onboarding@resend.dev>",
          to: [userEmail],
          subject: `📊 Your Daily Scan Digest - ${totalScans} scan${totalScans > 1 ? 's' : ''} analyzed`,
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
                          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">📊 Your Daily Scan Digest</h1>
                          <p style="color: #90EE90; font-size: 14px; margin: 10px 0 0;">${new Date(yesterdayStart).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </td>
                      </tr>
                      
                      <!-- Summary Stats -->
                      <tr>
                        <td style="padding: 30px 40px;">
                          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="text-align: center; padding: 10px;">
                                  <div style="font-size: 32px; font-weight: bold; color: #006600;">${totalScans}</div>
                                  <div style="font-size: 12px; color: #666666;">Total Scans</div>
                                </td>
                                <td style="text-align: center; padding: 10px; border-left: 1px solid #e5e7eb;">
                                  <div style="font-size: 32px; font-weight: bold; color: ${getScoreColor(avgScore)};">${avgScore}</div>
                                  <div style="font-size: 12px; color: #666666;">Avg Score</div>
                                </td>
                                <td style="text-align: center; padding: 10px; border-left: 1px solid #e5e7eb;">
                                  <div style="font-size: 32px; font-weight: bold; color: #22c55e;">${safeScans}</div>
                                  <div style="font-size: 12px; color: #666666;">Safe</div>
                                </td>
                                <td style="text-align: center; padding: 10px; border-left: 1px solid #e5e7eb;">
                                  <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${riskyScans}</div>
                                  <div style="font-size: 12px; color: #666666;">Risky</div>
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- Score Range -->
                          <div style="margin-bottom: 25px;">
                            <h3 style="color: #333333; font-size: 16px; margin: 0 0 15px;">📈 Score Range</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="background: #f0fff0; padding: 15px; border-radius: 8px 0 0 8px; text-align: center;">
                                  <div style="font-size: 12px; color: #16a34a;">Highest</div>
                                  <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${highestScore}</div>
                                </td>
                                <td style="background: #fef3c7; padding: 15px; text-align: center;">
                                  <div style="font-size: 12px; color: #d97706;">Average</div>
                                  <div style="font-size: 24px; font-weight: bold; color: #d97706;">${avgScore}</div>
                                </td>
                                <td style="background: #fee2e2; padding: 15px; border-radius: 0 8px 8px 0; text-align: center;">
                                  <div style="font-size: 12px; color: #dc2626;">Lowest</div>
                                  <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${lowestScore}</div>
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- Recent Scans -->
                          <h3 style="color: #333333; font-size: 16px; margin: 0 0 15px;">🕐 Recent Scans</h3>
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                            ${scans.slice(0, 5).map((scan, i) => `
                              <tr>
                                <td style="padding: 12px; background: ${i % 2 === 0 ? '#f8f9fa' : '#ffffff'}; border-radius: ${i === 0 ? '8px 8px 0 0' : i === Math.min(4, scans.length - 1) ? '0 0 8px 8px' : '0'};">
                                  <span style="display: inline-block; width: 40px; height: 40px; background: ${getScoreColor(scan.overall_score)}; color: #ffffff; border-radius: 50%; text-align: center; line-height: 40px; font-weight: bold; font-size: 14px; margin-right: 15px;">${scan.overall_score}</span>
                                  <span style="color: #333333; font-size: 14px;">${scan.verdict}</span>
                                  <span style="float: right; color: #999999; font-size: 12px;">${new Date(scan.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                              </tr>
                            `).join('')}
                          </table>

                          <!-- Today's Allowance -->
                          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 20px; text-align: center;">
                            <p style="margin: 0 0 5px; color: #0369a1; font-size: 14px;">Today's Scan Allowance</p>
                            <p style="margin: 0; color: #0369a1; font-size: 24px; font-weight: bold;">
                              ${profile.premium ? '∞ Unlimited' : `${(profile.scan_limit || 3) + (profile.bonus_scans || 0)} scans`}
                            </p>
                          </div>

                          ${!profile.premium ? `
                          <div style="text-align: center; margin-top: 25px;">
                            <a href="https://safe-bazaar-ai.lovable.app/premium" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                              ⭐ Get Unlimited Scans
                            </a>
                          </div>
                          ` : ''}
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background: #f8f9fa; padding: 20px 40px; text-align: center;">
                          <p style="color: #666666; font-size: 12px; margin: 0;">
                            🇰🇪 Safe Bazaar AI - Keeping Kenya Shopping Safe
                          </p>
                          <p style="color: #999999; font-size: 11px; margin: 10px 0 0;">
                            <a href="https://safe-bazaar-ai.lovable.app/scan" style="color: #006600; text-decoration: none;">Scan a Product</a> • 
                            <a href="https://safe-bazaar-ai.lovable.app/history" style="color: #006600; text-decoration: none;">View History</a>
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

        emailsSent++;
        console.log(`[DAILY-DIGEST] Sent to ${userEmail}`);
      } catch (userError: any) {
        errors.push(`${profile.user_id}: ${userError.message}`);
        console.error(`[DAILY-DIGEST] Error for user ${profile.user_id}:`, userError);
      }
    }

    console.log(`[DAILY-DIGEST] Completed. Sent: ${emailsSent}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[DAILY-DIGEST] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
