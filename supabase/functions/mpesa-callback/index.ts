import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[MPESA-CALLBACK] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const callback = await req.json();
    logStep("Callback received", callback);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse M-Pesa callback
    const stkCallback = callback.Body?.stkCallback;
    
    if (!stkCallback) {
      logStep("Invalid callback structure");
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    logStep("Parsed callback", { CheckoutRequestID, ResultCode, ResultDesc });

    // Find the transaction
    const { data: transaction, error: txnError } = await supabaseClient
      .from("mpesa_transactions")
      .select("*")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (txnError || !transaction) {
      logStep("Transaction not found", { CheckoutRequestID, error: txnError?.message });
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Transaction not found but acknowledged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Found transaction", { transactionId: transaction.id, userId: transaction.user_id, plan: transaction.plan });

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      
      const getMetaValue = (name: string) => {
        const item = metadata.find((m: { Name: string }) => m.Name === name);
        return item?.Value;
      };

      const amount = getMetaValue("Amount");
      const mpesaReceiptNumber = getMetaValue("MpesaReceiptNumber");
      const phoneNumber = getMetaValue("PhoneNumber");
      const transactionDate = getMetaValue("TransactionDate");

      logStep("Payment successful", { amount, mpesaReceiptNumber, phoneNumber });

      // Update transaction status
      const { error: updateTxnError } = await supabaseClient
        .from("mpesa_transactions")
        .update({
          status: "completed",
          mpesa_receipt_number: mpesaReceiptNumber,
          result_code: ResultCode,
          result_desc: ResultDesc,
          transaction_date: transactionDate ? new Date(
            transactionDate.toString().replace(
              /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
              "$1-$2-$3T$4:$5:$6"
            )
          ).toISOString() : new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (updateTxnError) {
        logStep("Error updating transaction", { error: updateTxnError.message });
      }

      // Calculate subscription expiry (28 days = 4 weeks)
      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + 28 * 24 * 60 * 60 * 1000);

      // Check if user already has a subscription
      const { data: existingSub } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", transaction.user_id)
        .single();

      if (existingSub) {
        // Update existing subscription
        const { error: updateSubError } = await supabaseClient
          .from("subscriptions")
          .update({
            plan: transaction.plan,
            payment_method: "mpesa",
            status: "active",
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            transaction_id: transaction.id,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", transaction.user_id);

        if (updateSubError) {
          logStep("Error updating subscription", { error: updateSubError.message });
        } else {
          logStep("Subscription updated", { expiresAt: expiresAt.toISOString() });
        }
      } else {
        // Create new subscription
        const { error: createSubError } = await supabaseClient
          .from("subscriptions")
          .insert({
            user_id: transaction.user_id,
            plan: transaction.plan,
            payment_method: "mpesa",
            status: "active",
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            transaction_id: transaction.id,
          });

        if (createSubError) {
          logStep("Error creating subscription", { error: createSubError.message });
        } else {
          logStep("Subscription created", { expiresAt: expiresAt.toISOString() });
        }
      }

      // Update user profile with premium status
      const isPremiumSeller = transaction.plan === "premium_seller";
      const updateData: Record<string, unknown> = {
        premium: true,
        subscription_tier: transaction.plan,
        scan_limit: -1, // Unlimited scans
        voice_readout_enabled: true,
        premium_expires_at: expiresAt.toISOString(),
      };

      // Generate API key for premium sellers
      if (isPremiumSeller) {
        const { data: apiKeyData } = await supabaseClient.rpc("generate_api_key");
        if (apiKeyData) {
          updateData.api_key = apiKeyData;
          updateData.seller_verified = true;
        }
      }

      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update(updateData)
        .eq("user_id", transaction.user_id);

      if (profileError) {
        logStep("Error updating profile", { error: profileError.message });
      } else {
        logStep("Profile updated to premium", { plan: transaction.plan, isPremiumSeller });
      }

      // Send confirmation email (optional - if Resend is configured)
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          // Get user email
          const { data: userData } = await supabaseClient.auth.admin.getUserById(transaction.user_id);
          if (userData?.user?.email) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Safe Bazaar AI <noreply@safebazaar.ai>",
                to: [userData.user.email],
                subject: `🎉 Welcome to ${transaction.plan === "premium_seller" ? "Premium Seller" : "Premium"}!`,
                html: `
                  <h1>Payment Confirmed!</h1>
                  <p>Thank you for subscribing to Safe Bazaar AI ${transaction.plan === "premium_seller" ? "Premium Seller" : "Premium"}!</p>
                  <p><strong>M-Pesa Receipt:</strong> ${mpesaReceiptNumber}</p>
                  <p><strong>Amount Paid:</strong> KES ${amount}</p>
                  <p><strong>Subscription Valid Until:</strong> ${expiresAt.toLocaleDateString()}</p>
                  <p>Enjoy unlimited scans and all premium features!</p>
                `,
              }),
            });
            logStep("Confirmation email sent");
          }
        }
      } catch (emailError) {
        const emailErrorMessage = emailError instanceof Error ? emailError.message : String(emailError);
        logStep("Email sending failed", { error: emailErrorMessage });
      }

    } else {
      // Payment failed or cancelled
      logStep("Payment failed", { ResultCode, ResultDesc });

      await supabaseClient
        .from("mpesa_transactions")
        .update({
          status: ResultCode === 1032 ? "cancelled" : "failed",
          result_code: ResultCode,
          result_desc: ResultDesc,
        })
        .eq("id", transaction.id);
    }

    // Always acknowledge receipt to M-Pesa
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Callback processed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error processing callback", { message: errorMessage });
    // Still acknowledge to prevent retries
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Acknowledged" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
