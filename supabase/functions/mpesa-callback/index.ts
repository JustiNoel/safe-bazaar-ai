import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const callback = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(callback, null, 2));

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse M-Pesa callback
    const stkCallback = callback.Body?.stkCallback;
    
    if (!stkCallback) {
      console.error("Invalid callback structure");
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log(`Callback for CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

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

      console.log(`Payment successful! Amount: ${amount}, Receipt: ${mpesaReceiptNumber}, Phone: ${phoneNumber}`);

      // Here you would:
      // 1. Find the user associated with this payment (by phone or stored transaction)
      // 2. Update their subscription status
      // 3. Store the transaction record

      // For now, log the success
      // In production, implement proper user lookup and subscription update
      
    } else {
      // Payment failed or cancelled
      console.log(`Payment failed or cancelled. ResultDesc: ${ResultDesc}`);
    }

    // Always acknowledge receipt
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Callback processed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    // Still acknowledge to prevent retries
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Acknowledged" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
