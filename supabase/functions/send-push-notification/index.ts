import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY');

interface PushNotificationPayload {
  userId?: string;
  fcmToken?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  click_action?: string;
}

async function sendFCMNotification(token: string, title: string, body: string, data?: Record<string, string>) {
  if (!FIREBASE_SERVER_KEY) {
    console.log('FIREBASE_SERVER_KEY not set, skipping push notification');
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          click_action: 'https://safebazaar.co.ke',
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        priority: 'high',
      }),
    });

    const result = await response.json();
    console.log('FCM response:', result);

    if (result.success === 1) {
      return { success: true };
    } else {
      return { success: false, error: result.results?.[0]?.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('FCM error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PushNotificationPayload = await req.json();
    const { userId, fcmToken, title, body, data } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tokenToUse = fcmToken;

    // If userId is provided, fetch the FCM token from the database
    if (userId && !fcmToken) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('fcm_token')
        .eq('user_id', userId)
        .single();

      if (error || !profile?.fcm_token) {
        console.log('No FCM token found for user:', userId);
        return new Response(
          JSON.stringify({ success: false, error: 'No FCM token found for user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      tokenToUse = profile.fcm_token;
    }

    if (!tokenToUse) {
      return new Response(
        JSON.stringify({ error: 'Either userId or fcmToken is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendFCMNotification(tokenToUse, title, body, data);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
