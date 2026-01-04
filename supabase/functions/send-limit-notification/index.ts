import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LimitNotificationRequest {
  email: string;
  phone?: string;
  scansUsed: number;
  scanLimit: number;
  nextResetTime: string;
  preferences?: {
    limit_alerts_email?: boolean;
    limit_alerts_sms?: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, scansUsed, scanLimit, nextResetTime, preferences }: LimitNotificationRequest = await req.json();
    console.log("[LIMIT-NOTIFICATION] Sending to:", email, phone, "Preferences:", preferences);

    const results: { email?: boolean; sms?: boolean; skipped?: string[] } = {};
    const skipped: string[] = [];

    // Check if user has opted out of email alerts
    const sendEmail = preferences?.limit_alerts_email !== false;
    const sendSms = preferences?.limit_alerts_sms !== false;

    if (!sendEmail) {
      skipped.push("email");
      console.log("[LIMIT-NOTIFICATION] Email skipped - user opted out");
    }

    if (!sendSms) {
      skipped.push("sms");
      console.log("[LIMIT-NOTIFICATION] SMS skipped - user opted out");
    }

    results.skipped = skipped;

    // Send Email via Resend (only if user hasn't opted out)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY && email && sendEmail) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        
        const emailResponse = await resend.emails.send({
          from: "Safe Bazaar AI <onboarding@resend.dev>",
          to: [email],
          subject: "⚠️ Daily Scan Limit Reached - Upgrade for Unlimited Scans!",
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
                    <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); border-radius: 16px; overflow: hidden;">
                      <!-- Header -->
                      <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                          <div style="width: 80px; height: 80px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                            <span style="font-size: 40px;">⚠️</span>
                          </div>
                          <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: bold;">Scan Limit Reached!</h1>
                          <p style="color: #FFE4B5; font-size: 16px; margin: 10px 0 0;">You've used ${scansUsed}/${scanLimit} daily scans</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 30px 40px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 30px;">
                            <tr>
                              <td>
                                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                  You've reached your daily limit of <strong>${scanLimit} free scans</strong>. Don't worry - your scans will reset at <strong>${nextResetTime}</strong>.
                                </p>
                                
                                <div style="background: #fff8e1; border-left: 4px solid #FF6B00; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                  <h3 style="color: #FF6B00; margin: 0 0 10px; font-size: 16px;">🚀 Want Unlimited Scans?</h3>
                                  <p style="color: #333333; font-size: 14px; margin: 0;">
                                    Upgrade to <strong>Premium</strong> for just <strong>KES 200/month</strong> and get:
                                  </p>
                                  <ul style="color: #333333; margin: 10px 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                                    <li>✅ <strong>Unlimited scans</strong> - No daily limits</li>
                                    <li>✅ <strong>Full risk breakdown</strong> - Detailed analysis</li>
                                    <li>✅ <strong>Voice readout</strong> - Hear results in Swahili/English</li>
                                    <li>✅ <strong>Scan history</strong> - Track all your scans</li>
                                  </ul>
                                </div>

                                <div style="text-align: center; margin: 30px 0;">
                                  <a href="https://safe-bazaar-ai.lovable.app/premium" style="display: inline-block; background: linear-gradient(135deg, #006600 0%, #008800 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                    Upgrade to Premium →
                                  </a>
                                </div>

                                <p style="color: #666666; font-size: 14px; text-align: center; margin: 20px 0 0;">
                                  Or wait until <strong>${nextResetTime}</strong> for your daily reset.
                                </p>
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
                                <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
                                  <p style="color: #ffffff; font-size: 14px; margin: 0;">
                                    🇰🇪 Safe Bazaar AI - Shop with Confidence
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

        console.log("[LIMIT-NOTIFICATION] Email sent:", emailResponse.data?.id);
        results.email = true;
      } catch (emailError) {
        console.error("[LIMIT-NOTIFICATION] Email error:", emailError);
        results.email = false;
      }
    }

    // Send SMS via Africa's Talking (only if user hasn't opted out)
    const AT_API_KEY = Deno.env.get("AFRICASTALKING_API_KEY");
    const AT_USERNAME = Deno.env.get("AFRICASTALKING_USERNAME");
    
    if (AT_API_KEY && AT_USERNAME && phone && sendSms) {
      try {
        // Format phone number for Kenya (ensure it starts with +254)
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+254" + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+254" + formattedPhone;
        }

        const smsMessage = `Safe Bazaar AI: You've used all ${scanLimit} daily scans! Upgrade to Premium (KES 200/mo) for unlimited scans or wait until ${nextResetTime} for reset. Visit: safe-bazaar-ai.lovable.app/premium`;

        // Africa's Talking API endpoint
        const atEndpoint = AT_USERNAME === "sandbox" 
          ? "https://api.sandbox.africastalking.com/version1/messaging"
          : "https://api.africastalking.com/version1/messaging";

        const smsResponse = await fetch(atEndpoint, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "apiKey": AT_API_KEY,
          },
          body: new URLSearchParams({
            username: AT_USERNAME,
            to: formattedPhone,
            message: smsMessage,
            from: "SafeBazaar", // Sender ID (may need registration)
          }),
        });

        const smsData = await smsResponse.json();
        console.log("[LIMIT-NOTIFICATION] SMS response:", JSON.stringify(smsData));
        
        if (smsData.SMSMessageData?.Recipients?.[0]?.status === "Success") {
          results.sms = true;
        } else {
          results.sms = false;
          console.warn("[LIMIT-NOTIFICATION] SMS may have failed:", smsData);
        }
      } catch (smsError) {
        console.error("[LIMIT-NOTIFICATION] SMS error:", smsError);
        results.sms = false;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[LIMIT-NOTIFICATION] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
