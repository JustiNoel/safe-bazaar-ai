import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CHECK-MPESA-STATUS] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    logStep("User authenticated", { userId: user.id });

    const { checkoutRequestId } = await req.json();

    if (!checkoutRequestId) {
      throw new Error("checkoutRequestId is required");
    }

    logStep("Checking status", { checkoutRequestId });

    // Find the transaction
    const { data: transaction, error: txnError } = await supabaseClient
      .from("mpesa_transactions")
      .select("*")
      .eq("checkout_request_id", checkoutRequestId)
      .eq("user_id", user.id)
      .single();

    if (txnError || !transaction) {
      throw new Error("Transaction not found");
    }

    logStep("Transaction found", { status: transaction.status, plan: transaction.plan });

    // If completed, also get subscription details
    let subscription = null;
    if (transaction.status === "completed") {
      const { data: subData } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      subscription = subData;
      logStep("Subscription found", { plan: subscription?.plan, expiresAt: subscription?.expires_at });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          plan: transaction.plan,
          amount: transaction.amount,
          mpesaReceiptNumber: transaction.mpesa_receipt_number,
          resultDesc: transaction.result_desc,
          createdAt: transaction.created_at,
          completedAt: transaction.completed_at,
        },
        subscription: subscription ? {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          startsAt: subscription.starts_at,
          expiresAt: subscription.expires_at,
        } : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
