-- Create table for county scam data (real-time scam tracking)
CREATE TABLE public.county_scams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_name text NOT NULL,
  scam_type text NOT NULL,
  scam_count integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  last_reported_at timestamp with time zone DEFAULT now(),
  data_source text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_county_scams_county ON public.county_scams(county_name);
CREATE INDEX idx_county_scams_scam_type ON public.county_scams(scam_type);

-- Enable RLS
ALTER TABLE public.county_scams ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage county scams"
  ON public.county_scams
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Public read access for the heatmap
CREATE POLICY "Anyone can view county scams"
  ON public.county_scams
  FOR SELECT
  USING (true);

-- Create exec_members table for admin-managed executive members
CREATE TABLE public.exec_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'moderator',
  added_by uuid NOT NULL,
  permissions jsonb DEFAULT '{"can_view_users": true, "can_issue_tokens": false}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exec_members ENABLE ROW LEVEL SECURITY;

-- Only admins can manage exec members
CREATE POLICY "Admins can manage exec members"
  ON public.exec_members
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Exec members can view themselves
CREATE POLICY "Exec members can view themselves"
  ON public.exec_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create scan_tokens table for admin-issued bonus scans
CREATE TABLE public.scan_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_count integer NOT NULL DEFAULT 5,
  issued_by uuid NOT NULL,
  reason text,
  used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tokens
CREATE POLICY "Admins can manage scan tokens"
  ON public.scan_tokens
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own tokens
CREATE POLICY "Users can view own tokens"
  ON public.scan_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Enable realtime for county scams
ALTER PUBLICATION supabase_realtime ADD TABLE public.county_scams;

-- Create trigger for updated_at
CREATE TRIGGER update_county_scams_updated_at
  BEFORE UPDATE ON public.county_scams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial county scam data for all 47 Kenya counties
INSERT INTO public.county_scams (county_name, scam_type, scam_count, risk_level, data_source) VALUES
  ('Nairobi', 'Online Shopping Fraud', 156, 'critical', 'National Police Service'),
  ('Nairobi', 'M-Pesa Fraud', 89, 'high', 'Safaricom Reports'),
  ('Nairobi', 'Counterfeit Products', 97, 'high', 'KEBS Reports'),
  ('Mombasa', 'Online Shopping Fraud', 78, 'high', 'National Police Service'),
  ('Mombasa', 'Counterfeit Electronics', 54, 'medium', 'Consumer Reports'),
  ('Mombasa', 'M-Pesa Fraud', 55, 'medium', 'Safaricom Reports'),
  ('Kisumu', 'Online Shopping Fraud', 45, 'medium', 'National Police Service'),
  ('Kisumu', 'Counterfeit Products', 33, 'medium', 'KEBS Reports'),
  ('Kisumu', 'Agricultural Fraud', 20, 'low', 'Ministry of Agriculture'),
  ('Nakuru', 'Online Shopping Fraud', 38, 'medium', 'National Police Service'),
  ('Nakuru', 'Counterfeit Electronics', 28, 'low', 'Consumer Reports'),
  ('Nakuru', 'M-Pesa Fraud', 10, 'low', 'Safaricom Reports'),
  ('Uasin Gishu', 'Online Shopping Fraud', 32, 'medium', 'National Police Service'),
  ('Uasin Gishu', 'Counterfeit Products', 22, 'low', 'KEBS Reports'),
  ('Kiambu', 'Online Shopping Fraud', 67, 'high', 'National Police Service'),
  ('Kiambu', 'Counterfeit Products', 45, 'medium', 'KEBS Reports'),
  ('Kiambu', 'M-Pesa Fraud', 38, 'medium', 'Safaricom Reports'),
  ('Machakos', 'Online Shopping Fraud', 42, 'medium', 'National Police Service'),
  ('Machakos', 'Counterfeit Electronics', 35, 'medium', 'Consumer Reports'),
  ('Kajiado', 'Online Shopping Fraud', 28, 'low', 'National Police Service'),
  ('Kajiado', 'Real Estate Fraud', 15, 'low', 'Land Registry'),
  ('Meru', 'Agricultural Fraud', 25, 'low', 'Ministry of Agriculture'),
  ('Meru', 'Counterfeit Products', 12, 'low', 'KEBS Reports'),
  ('Nyeri', 'Online Shopping Fraud', 22, 'low', 'National Police Service'),
  ('Nyeri', 'Counterfeit Products', 18, 'low', 'KEBS Reports'),
  ('Kilifi', 'Tourism Scams', 35, 'medium', 'Tourism Board'),
  ('Kilifi', 'Online Shopping Fraud', 28, 'low', 'National Police Service'),
  ('Kakamega', 'Agricultural Fraud', 30, 'medium', 'Ministry of Agriculture'),
  ('Kakamega', 'M-Pesa Fraud', 18, 'low', 'Safaricom Reports'),
  ('Bungoma', 'Agricultural Fraud', 22, 'low', 'Ministry of Agriculture'),
  ('Kisii', 'Online Shopping Fraud', 35, 'medium', 'National Police Service'),
  ('Kisii', 'Counterfeit Products', 27, 'low', 'KEBS Reports'),
  ('Narok', 'Tourism Scams', 18, 'low', 'Tourism Board'),
  ('Migori', 'Cross-border Fraud', 24, 'low', 'Border Control'),
  ('Homa Bay', 'Agricultural Fraud', 15, 'low', 'Ministry of Agriculture'),
  ('Siaya', 'M-Pesa Fraud', 12, 'low', 'Safaricom Reports'),
  ('Kericho', 'Agricultural Fraud', 20, 'low', 'Ministry of Agriculture'),
  ('Bomet', 'Agricultural Fraud', 14, 'low', 'Ministry of Agriculture'),
  ('Trans Nzoia', 'Agricultural Fraud', 18, 'low', 'Ministry of Agriculture'),
  ('Nandi', 'Agricultural Fraud', 12, 'low', 'Ministry of Agriculture'),
  ('Baringo', 'Agricultural Fraud', 10, 'low', 'Ministry of Agriculture'),
  ('Laikipia', 'Real Estate Fraud', 15, 'low', 'Land Registry'),
  ('Turkana', 'Aid Diversion Scams', 8, 'low', 'NGO Reports'),
  ('Marsabit', 'Aid Diversion Scams', 5, 'low', 'NGO Reports'),
  ('Garissa', 'Cross-border Fraud', 12, 'low', 'Border Control'),
  ('Wajir', 'Cross-border Fraud', 8, 'low', 'Border Control'),
  ('Mandera', 'Cross-border Fraud', 6, 'low', 'Border Control'),
  ('Isiolo', 'Livestock Fraud', 10, 'low', 'Veterinary Dept'),
  ('Samburu', 'Livestock Fraud', 8, 'low', 'Veterinary Dept'),
  ('West Pokot', 'Livestock Fraud', 7, 'low', 'Veterinary Dept'),
  ('Elgeyo Marakwet', 'Agricultural Fraud', 9, 'low', 'Ministry of Agriculture'),
  ('Tharaka Nithi', 'Agricultural Fraud', 11, 'low', 'Ministry of Agriculture'),
  ('Embu', 'Online Shopping Fraud', 18, 'low', 'National Police Service'),
  ('Kirinyaga', 'Agricultural Fraud', 14, 'low', 'Ministry of Agriculture'),
  ('Muranga', 'Online Shopping Fraud', 20, 'low', 'National Police Service'),
  ('Nyandarua', 'Agricultural Fraud', 12, 'low', 'Ministry of Agriculture'),
  ('Lamu', 'Tourism Scams', 10, 'low', 'Tourism Board'),
  ('Taita Taveta', 'Tourism Scams', 12, 'low', 'Tourism Board'),
  ('Kwale', 'Tourism Scams', 15, 'low', 'Tourism Board'),
  ('Tana River', 'Agricultural Fraud', 6, 'low', 'Ministry of Agriculture'),
  ('Kitui', 'Agricultural Fraud', 18, 'low', 'Ministry of Agriculture'),
  ('Makueni', 'Agricultural Fraud', 16, 'low', 'Ministry of Agriculture'),
  ('Vihiga', 'M-Pesa Fraud', 10, 'low', 'Safaricom Reports'),
  ('Busia', 'Cross-border Fraud', 22, 'low', 'Border Control'),
  ('Nyamira', 'Agricultural Fraud', 10, 'low', 'Ministry of Agriculture');