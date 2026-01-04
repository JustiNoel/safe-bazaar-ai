-- Create mpesa_transactions table to track all M-Pesa payments
CREATE TABLE public.mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'premium_seller')),
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  result_code INTEGER,
  result_desc TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create subscriptions table to track active subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'premium_seller')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'stripe')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  transaction_id UUID REFERENCES public.mpesa_transactions(id),
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add premium-related columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'premium_seller')),
ADD COLUMN IF NOT EXISTS voice_readout_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS api_calls_today INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for mpesa_transactions
CREATE POLICY "Users can view own transactions"
ON public.mpesa_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.mpesa_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update transactions"
ON public.mpesa_transactions FOR UPDATE
USING (true);

CREATE POLICY "Admins can view all transactions"
ON public.mpesa_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update subscriptions"
ON public.subscriptions FOR UPDATE
USING (true);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_mpesa_transactions_user_id ON public.mpesa_transactions(user_id);
CREATE INDEX idx_mpesa_transactions_checkout_request_id ON public.mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_transactions_status ON public.mpesa_transactions(status);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX idx_profiles_api_key ON public.profiles(api_key);

-- Function to generate unique API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_key TEXT;
  key_exists BOOLEAN;
BEGIN
  LOOP
    new_key := 'sb_' || encode(gen_random_bytes(24), 'hex');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE api_key = new_key) INTO key_exists;
    EXIT WHEN NOT key_exists;
  END LOOP;
  RETURN new_key;
END;
$$;

-- Trigger to update updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();