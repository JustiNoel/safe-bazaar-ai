import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Loader2, CheckCircle, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "premium" | "premium_seller";
  amount: number;
}

type PaymentStatus = "idle" | "sending" | "waiting" | "success" | "error";

export default function MpesaPaymentModal({
  isOpen,
  onClose,
  plan,
  amount,
}: MpesaPaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const { checkMpesaPayment, refreshProfile } = useAuth();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for payment status
  useEffect(() => {
    if (status === "waiting" && checkoutRequestId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const result = await checkMpesaPayment(checkoutRequestId);
          
          if (result?.transaction?.status === "completed") {
            setStatus("success");
            toast.success("🎉 Payment successful! Welcome to Premium!");
            await refreshProfile();
            
            // Stop polling and close modal after showing success
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            setTimeout(() => {
              handleClose();
              window.location.reload(); // Refresh to update all premium features
            }, 2000);
          } else if (result?.transaction?.status === "failed" || result?.transaction?.status === "cancelled") {
            setStatus("error");
            setError(result?.transaction?.resultDesc || "Payment failed or was cancelled");
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
          }
        } catch (err) {
          console.error("Error polling payment status:", err);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [status, checkoutRequestId, checkMpesaPayment, refreshProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\s/g, "");
    if (!/^(07|01|2547|2541|\+2547|\+2541)\d{8}$/.test(cleanPhone)) {
      setError("Please enter a valid Kenyan phone number");
      return;
    }

    setStatus("sending");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          phone: cleanPhone,
          amount: amount,
          plan: plan,
          accountReference: `SafeBazaar-${plan}`,
        },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setStatus("waiting");
        setCheckoutRequestId(data.checkoutRequestId);
        toast.success("Check your phone for the M-Pesa prompt!");
      } else {
        throw new Error(data?.error || "Failed to initiate payment");
      }
    } catch (err: any) {
      console.error("M-Pesa error:", err);
      setStatus("error");
      setError(err.message || "Failed to send M-Pesa request");
      toast.error("Payment initiation failed. Please try again.");
    }
  };

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setStatus("idle");
    setPhoneNumber("");
    setError("");
    setCheckoutRequestId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-success/20">
              <Phone className="h-5 w-5 text-success" />
            </div>
            Pay with M-Pesa
          </DialogTitle>
          <DialogDescription>
            Enter your M-Pesa phone number to receive a payment prompt
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === "idle" || status === "error" ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Amount to pay</p>
                <p className="text-3xl font-bold text-primary">
                  KES {amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan === "premium" ? "Premium Plan - Monthly (28 days)" : "Premium Seller - Monthly (28 days)"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-success hover:bg-success/90">
                  Send Prompt
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You'll receive an M-Pesa push notification on your phone.
                Enter your PIN to complete the payment.
              </p>
            </motion.form>
          ) : status === "sending" ? (
            <motion.div
              key="sending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 font-medium">Sending payment request...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </motion.div>
          ) : status === "waiting" ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Smartphone className="h-16 w-16 mx-auto text-success" />
              </motion.div>
              <p className="mt-4 font-medium">Check your phone!</p>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your M-Pesa PIN to complete the payment
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Waiting for confirmation...
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="mt-4"
              >
                Close
              </Button>
            </motion.div>
          ) : status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <CheckCircle className="h-16 w-16 mx-auto text-success" />
              </motion.div>
              <p className="mt-4 font-medium text-success">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">
                Welcome to {plan === "premium" ? "Premium" : "Premium Seller"}!
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
