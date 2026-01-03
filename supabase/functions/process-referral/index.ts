import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessReferralRequest {
  referredUserId: string;
  referralCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referredUserId, referralCode }: ProcessReferralRequest = await req.json();
    console.log("[PROCESS-REFERRAL] Processing for:", referredUserId, "code:", referralCode);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the referred user's profile
    const { data: referredProfile, error: referredError } = await supabase
      .from("profiles")
      .select("user_id, referred_by")
      .eq("user_id", referredUserId)
      .single();

    if (referredError || !referredProfile) {
      throw new Error("Referred user not found");
    }

    // Check if already processed
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id, status")
      .eq("referred_id", referredUserId)
      .single();

    if (existingReferral?.status === "completed") {
      console.log("[PROCESS-REFERRAL] Already completed for this user");
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let referrerId = referredProfile.referred_by;

    // If no referred_by but referral code provided, look up the referrer
    if (!referrerId && referralCode) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", referralCode.toUpperCase())
        .single();

      if (referrer) {
        referrerId = referrer.user_id;
        
        // Update the referred user's profile
        await supabase
          .from("profiles")
          .update({ referred_by: referrerId })
          .eq("user_id", referredUserId);
      }
    }

    if (!referrerId) {
      console.log("[PROCESS-REFERRAL] No referrer found");
      return new Response(JSON.stringify({ success: true, noReferrer: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Can't refer yourself
    if (referrerId === referredUserId) {
      console.log("[PROCESS-REFERRAL] Self-referral attempted");
      return new Response(JSON.stringify({ success: false, error: "Cannot refer yourself" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const bonusScans = 2;

    // Create or update the referral record
    if (existingReferral) {
      await supabase
        .from("referrals")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", existingReferral.id);
    } else {
      await supabase
        .from("referrals")
        .insert({
          referrer_id: referrerId,
          referred_id: referredUserId,
          bonus_awarded: bonusScans,
          status: "completed",
          completed_at: new Date().toISOString()
        });
    }

    // Award bonus scans to referrer
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("bonus_scans, referral_count")
      .eq("user_id", referrerId)
      .single();

    const newBonusScans = (referrerProfile?.bonus_scans || 0) + bonusScans;
    const newReferralCount = (referrerProfile?.referral_count || 0) + 1;

    // Check for milestone bonuses
    let milestoneBonusScan = 0;
    if (newReferralCount === 5) milestoneBonusScan = 5;
    else if (newReferralCount === 10) milestoneBonusScan = 10;
    else if (newReferralCount === 25) milestoneBonusScan = 25;

    await supabase
      .from("profiles")
      .update({ 
        bonus_scans: newBonusScans + milestoneBonusScan,
        referral_count: newReferralCount
      })
      .eq("user_id", referrerId);

    // Get referred user's email for the notification
    const { data: referredUserData } = await supabase.auth.admin.getUserById(referredUserId);
    const referredEmail = referredUserData?.user?.email || "A friend";

    // Send referral success email
    try {
      await supabase.functions.invoke("send-referral-email", {
        body: {
          referrerId,
          referredEmail,
          bonusAwarded: bonusScans + milestoneBonusScan
        }
      });
    } catch (emailError) {
      console.error("[PROCESS-REFERRAL] Failed to send email:", emailError);
      // Don't fail the whole operation if email fails
    }

    console.log("[PROCESS-REFERRAL] Successfully processed. Referrer:", referrerId, "Bonus:", bonusScans + milestoneBonusScan);

    return new Response(JSON.stringify({ 
      success: true, 
      referrerId,
      bonusAwarded: bonusScans,
      milestoneBonusScan,
      newReferralCount
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[PROCESS-REFERRAL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
