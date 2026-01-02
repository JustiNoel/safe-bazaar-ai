-- Update default scan_limit from 5 to 3 for new users
ALTER TABLE public.profiles ALTER COLUMN scan_limit SET DEFAULT 3;

-- Add banned column to profiles for user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_reason text;

-- Add premium_expires_at for manual premium upgrades
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at timestamp with time zone;

-- Create admin_actions table to log admin activities
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin actions
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert admin actions
CREATE POLICY "Admins can insert admin actions"
ON public.admin_actions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile (for banning, premium upgrades, etc.)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));