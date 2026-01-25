-- Add seller profile columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS seller_product_image TEXT,
ADD COLUMN IF NOT EXISTS seller_product_name TEXT,
ADD COLUMN IF NOT EXISTS seller_product_price NUMERIC,
ADD COLUMN IF NOT EXISTS seller_location TEXT,
ADD COLUMN IF NOT EXISTS seller_national_id TEXT,
ADD COLUMN IF NOT EXISTS seller_email TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_bypass_limits BOOLEAN DEFAULT false;

-- Create index for admin lookup
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Update admin status for justinoel254@gmail.com
UPDATE public.profiles
SET is_admin = true, 
    admin_bypass_limits = true,
    subscription_tier = 'premium_seller',
    premium = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'justinoel254@gmail.com'
);