-- Add fcm_token column for push notifications
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Create index for faster FCM token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON public.profiles(fcm_token) WHERE fcm_token IS NOT NULL;