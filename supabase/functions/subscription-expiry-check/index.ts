import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function sendRenewalReminderEmail(email: string, daysRemaining: number, plan: string) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping email');
    return;
  }

  const planName = plan === 'premium_seller' ? 'Premium Seller' : 'Premium';
  const price = plan === 'premium_seller' ? 'KES 500' : 'KES 200';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SafeBazaar <noreply@safebazaar.co.ke>',
        to: [email],
        subject: `⚠️ Your ${planName} subscription expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .warning-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
              .warning-box .days { font-size: 48px; font-weight: bold; color: #d97706; }
              .warning-box .label { color: #92400e; font-size: 14px; }
              .features { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .feature-item { display: flex; align-items: center; padding: 8px 0; }
              .feature-item::before { content: "✓"; color: #10b981; margin-right: 10px; font-weight: bold; }
              .cta { text-align: center; margin: 30px 0; }
              .cta a { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🛡️ SafeBazaar Subscription Reminder</h1>
              </div>
              <div class="content">
                <p>Jambo! 👋</p>
                <p>Your <strong>${planName}</strong> subscription is expiring soon:</p>
                
                <div class="warning-box">
                  <div class="days">${daysRemaining}</div>
                  <div class="label">day${daysRemaining > 1 ? 's' : ''} remaining</div>
                </div>
                
                <p>Don't lose access to your premium features:</p>
                <div class="features">
                  ${plan === 'premium_seller' ? `
                    <div class="feature-item">Unlimited product scans</div>
                    <div class="feature-item">Seller verification badge</div>
                    <div class="feature-item">Analytics dashboard</div>
                    <div class="feature-item">Bulk product scanning</div>
                    <div class="feature-item">API access</div>
                  ` : `
                    <div class="feature-item">Unlimited product scans</div>
                    <div class="feature-item">Full risk breakdown</div>
                    <div class="feature-item">Voice readout</div>
                    <div class="feature-item">Priority support</div>
                  `}
                </div>
                
                <div class="cta">
                  <a href="https://safebazaar.co.ke/premium">Renew for ${price}/month</a>
                </div>
              </div>
              <div class="footer">
                <p>Asante sana for being a SafeBazaar member! 🇰🇪</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    console.log(`Renewal reminder sent to ${email}`);
  } catch (error) {
    console.error('Failed to send renewal email:', error);
  }
}

async function sendExpiryNotificationEmail(email: string, plan: string) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping email');
    return;
  }

  const planName = plan === 'premium_seller' ? 'Premium Seller' : 'Premium';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SafeBazaar <noreply@safebazaar.co.ke>',
        to: [email],
        subject: `Your ${planName} subscription has expired`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .cta { text-align: center; margin: 30px 0; }
              .cta a { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>😢 Your Subscription Has Expired</h1>
              </div>
              <div class="content">
                <p>Jambo! 👋</p>
                <p>Your <strong>${planName}</strong> subscription has expired. You've been moved back to our free plan with 3 scans per day.</p>
                <p>We'd love to have you back! Renew your subscription to regain access to all premium features.</p>
                <div class="cta">
                  <a href="https://safebazaar.co.ke/premium">Renew Subscription</a>
                </div>
              </div>
              <div class="footer">
                <p>Thank you for being part of SafeBazaar! 🇰🇪</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    console.log(`Expiry notification sent to ${email}`);
  } catch (error) {
    console.error('Failed to send expiry email:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting subscription expiry check...');

    // Get current time in EAT (UTC+3)
    const now = new Date();

    // 1. Send renewal reminders for subscriptions expiring in 3 days
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const { data: expiringSubscriptions, error: expiringError } = await supabase
      .from('subscriptions')
      .select('user_id, plan')
      .eq('status', 'active')
      .gte('expires_at', threeDaysStart.toISOString())
      .lte('expires_at', threeDaysEnd.toISOString());

    if (expiringError) {
      console.error('Error fetching expiring subscriptions:', expiringError);
    } else if (expiringSubscriptions && expiringSubscriptions.length > 0) {
      console.log(`Found ${expiringSubscriptions.length} subscriptions expiring in 3 days`);
      
      for (const sub of expiringSubscriptions) {
        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        if (userData?.user?.email) {
          await sendRenewalReminderEmail(userData.user.email, 3, sub.plan);
        }
      }
    }

    // 2. Send reminder for subscriptions expiring in 1 day
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStart = new Date(oneDayFromNow);
    oneDayStart.setHours(0, 0, 0, 0);
    const oneDayEnd = new Date(oneDayFromNow);
    oneDayEnd.setHours(23, 59, 59, 999);

    const { data: soonExpiringSubscriptions, error: soonError } = await supabase
      .from('subscriptions')
      .select('user_id, plan')
      .eq('status', 'active')
      .gte('expires_at', oneDayStart.toISOString())
      .lte('expires_at', oneDayEnd.toISOString());

    if (soonError) {
      console.error('Error fetching soon expiring subscriptions:', soonError);
    } else if (soonExpiringSubscriptions && soonExpiringSubscriptions.length > 0) {
      console.log(`Found ${soonExpiringSubscriptions.length} subscriptions expiring in 1 day`);
      
      for (const sub of soonExpiringSubscriptions) {
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        if (userData?.user?.email) {
          await sendRenewalReminderEmail(userData.user.email, 1, sub.plan);
        }
      }
    }

    // 3. Expire subscriptions that have passed their expiry date
    const { data: expiredSubscriptions, error: expiredError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan')
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    if (expiredError) {
      console.error('Error fetching expired subscriptions:', expiredError);
    } else if (expiredSubscriptions && expiredSubscriptions.length > 0) {
      console.log(`Found ${expiredSubscriptions.length} expired subscriptions to process`);
      
      for (const sub of expiredSubscriptions) {
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ status: 'expired', updated_at: now.toISOString() })
          .eq('id', sub.id);

        // Revert profile to free tier
        await supabase
          .from('profiles')
          .update({
            premium: false,
            subscription_tier: 'free',
            scan_limit: 3,
            seller_verified: false,
            api_key: null,
            updated_at: now.toISOString(),
          })
          .eq('user_id', sub.user_id);

        // Send expiry notification email
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        if (userData?.user?.email) {
          await sendExpiryNotificationEmail(userData.user.email, sub.plan);
        }

        console.log(`Expired subscription for user ${sub.user_id}`);
      }
    }

    const summary = {
      checked_at: now.toISOString(),
      reminders_3_days: expiringSubscriptions?.length || 0,
      reminders_1_day: soonExpiringSubscriptions?.length || 0,
      expired: expiredSubscriptions?.length || 0,
    };

    console.log('Subscription expiry check complete:', summary);

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in subscription expiry check:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
