import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  referralCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, referralCode }: WelcomeEmailRequest = await req.json();
    console.log("[WELCOME-EMAIL] Sending to:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's referral code from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("user_id", (await supabase.auth.admin.getUserById(
        (await supabase.from("profiles").select("user_id").eq("user_id", email).single()).data?.user_id || ""
      )).data.user?.id)
      .single();

    const userReferralCode = profile?.referral_code || referralCode || "SAFE-XXXXX";

    const emailResponse = await resend.emails.send({
      from: "Safe Bazaar AI <onboarding@resend.dev>",
      to: [email],
      subject: "Karibu to Safe Bazaar AI! 🛡️",
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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #006600 0%, #004400 100%); border-radius: 16px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 20px;">
                      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <span style="font-size: 40px;">🛡️</span>
                      </div>
                      <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">Karibu!</h1>
                      <p style="color: #90EE90; font-size: 18px; margin: 10px 0 0;">Welcome to Safe Bazaar AI</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 30px;">
                        <tr>
                          <td>
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                              You're now protected when shopping online in Kenya! Our AI-powered fraud detection helps you shop with confidence.
                            </p>
                            
                            <div style="background: #f0fff0; border-left: 4px solid #006600; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                              <h3 style="color: #006600; margin: 0 0 10px; font-size: 16px;">What You Get:</h3>
                              <ul style="color: #333333; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                                <li>✅ <strong>3 free scans daily</strong> - Reset at midnight EAT</li>
                                <li>✅ <strong>AI fraud detection</strong> - Instant risk analysis</li>
                                <li>✅ <strong>Safer alternatives</strong> - Find trusted vendors</li>
                              </ul>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                              <a href="https://safe-bazaar-ai.lovable.app/scan" style="display: inline-block; background: linear-gradient(135deg, #006600 0%, #008800 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Start Scanning Now →
                              </a>
                            </div>

                            <!-- Referral Section -->
                            <div style="background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); border-radius: 8px; padding: 20px; margin-top: 20px;">
                              <h3 style="color: #f57c00; margin: 0 0 10px; font-size: 16px;">🎁 Invite Friends, Get Extra Scans!</h3>
                              <p style="color: #666666; font-size: 14px; margin: 0 0 15px;">Share your referral code and earn 2 bonus scans for each friend who joins:</p>
                              <div style="background: #ffffff; border: 2px dashed #f57c00; border-radius: 8px; padding: 15px; text-align: center;">
                                <code style="font-size: 20px; font-weight: bold; color: #006600; letter-spacing: 2px;">${userReferralCode}</code>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <p style="color: #90EE90; font-size: 12px; margin: 0 0 10px;">
                              Questions? Reply to this email or contact justinoel254@gmail.com
                            </p>
                            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; margin-top: 10px;">
                              <p style="color: #ffffff; font-size: 14px; margin: 0;">
                                🇰🇪 Made with ❤️ in Kenya
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
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

    console.log("[WELCOME-EMAIL] Sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[WELCOME-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
