import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralEmailRequest {
  referrerId: string;
  referredEmail: string;
  bonusAwarded: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referrerId, referredEmail, bonusAwarded }: ReferralEmailRequest = await req.json();
    console.log("[REFERRAL-EMAIL] Processing for referrer:", referrerId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get referrer details
    const { data: referrer } = await supabase
      .from("profiles")
      .select("user_id, referral_count, bonus_scans, email_preferences")
      .eq("user_id", referrerId)
      .single();

    if (!referrer?.email_preferences?.referral) {
      console.log("[REFERRAL-EMAIL] Referrer opted out of referral emails");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get referrer email from auth
    const { data: userData } = await supabase.auth.admin.getUserById(referrerId);
    const referrerEmail = userData?.user?.email;

    if (!referrerEmail) {
      throw new Error("Could not find referrer email");
    }

    const totalReferrals = (referrer?.referral_count || 0) + 1;
    const totalBonusScans = (referrer?.bonus_scans || 0) + bonusAwarded;

    const emailResponse = await resend.emails.send({
      from: "Safe Bazaar AI <onboarding@resend.dev>",
      to: [referrerEmail],
      subject: `🎉 You earned ${bonusAwarded} bonus scans! A friend joined Safe Bazaar AI`,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px; overflow: hidden;">
                  <!-- Celebration Header -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 20px;">
                      <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
                      <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: bold;">Hongera! Congratulations!</h1>
                      <p style="color: #fef3c7; font-size: 16px; margin: 10px 0 0;">A friend just joined using your referral!</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 40px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 30px;">
                        <tr>
                          <td>
                            <!-- Bonus Badge -->
                            <div style="text-align: center; margin-bottom: 25px;">
                              <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; padding: 15px 30px; border-radius: 50px; font-size: 24px; font-weight: bold;">
                                +${bonusAwarded} Bonus Scans!
                              </div>
                            </div>

                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
                              Your friend has signed up for Safe Bazaar AI. As a thank you, we've added <strong>${bonusAwarded} extra scans</strong> to your account!
                            </p>
                            
                            <!-- Stats -->
                            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
                              <h3 style="color: #006600; margin: 0 0 15px; font-size: 16px; text-align: center;">📊 Your Referral Stats</h3>
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 10px; text-align: center; border-right: 1px solid #e5e7eb;">
                                    <div style="font-size: 28px; font-weight: bold; color: #006600;">${totalReferrals}</div>
                                    <div style="font-size: 12px; color: #666666;">Friends Invited</div>
                                  </td>
                                  <td style="padding: 10px; text-align: center;">
                                    <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${totalBonusScans}</div>
                                    <div style="font-size: 12px; color: #666666;">Total Bonus Scans</div>
                                  </td>
                                </tr>
                              </table>
                            </div>

                            <!-- Milestone Progress -->
                            ${totalReferrals >= 5 ? `
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                              <span style="font-size: 20px;">🏆</span>
                              <p style="margin: 5px 0 0; color: #92400e; font-weight: bold;">You've reached the Gold Tier!</p>
                              <p style="margin: 5px 0 0; color: #a16207; font-size: 12px;">Keep inviting to unlock more rewards</p>
                            </div>
                            ` : `
                            <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                              <p style="margin: 0; color: #0369a1; font-size: 14px; text-align: center;">
                                🎯 Invite ${5 - totalReferrals} more friend${5 - totalReferrals > 1 ? 's' : ''} to reach Gold Tier!
                              </p>
                            </div>
                            `}

                            <div style="text-align: center; margin-top: 25px;">
                              <a href="https://safe-bazaar-ai.lovable.app/scan" style="display: inline-block; background: linear-gradient(135deg, #006600 0%, #008800 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Use Your Bonus Scans →
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <p style="color: #fef3c7; font-size: 12px; margin: 0; text-align: center;">
                        Keep sharing your referral link to earn more bonus scans!
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

    console.log("[REFERRAL-EMAIL] Sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[REFERRAL-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
