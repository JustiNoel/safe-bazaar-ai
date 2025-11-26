-- Fix products table RLS policies to restrict access

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

-- Add policy: Users can only view products from their own scans
CREATE POLICY "Users view own products" 
ON public.products 
FOR SELECT 
USING (
  id IN (
    SELECT product_id 
    FROM public.scans 
    WHERE user_id = auth.uid()
  )
);

-- Add policy: Admins can view all products
CREATE POLICY "Admins view all products" 
ON public.products 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));