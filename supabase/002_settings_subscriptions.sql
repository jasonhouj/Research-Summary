-- Migration 002: Settings & Subscriptions
-- Run this in Supabase SQL Editor after schema.sql

-- Add new fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paper_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- Subscription tiers reference table
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  paper_limit INTEGER, -- NULL means unlimited
  price_monthly DECIMAL(10,2),
  features JSONB
);

-- Insert default tiers (using ON CONFLICT to make it safe to re-run)
INSERT INTO public.subscription_tiers (id, name, paper_limit, price_monthly, features) VALUES
  ('free', 'Free', 10, 0, '{"storage": "100MB", "support": "community"}'),
  ('pro', 'Pro', 100, 9.99, '{"storage": "5GB", "support": "email", "priority_processing": true}'),
  ('unlimited', 'Unlimited', NULL, 19.99, '{"storage": "unlimited", "support": "priority", "priority_processing": true, "api_access": true}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  paper_limit = EXCLUDED.paper_limit,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;

-- Enable RLS on subscription_tiers (read-only for all authenticated users)
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON public.subscription_tiers;
CREATE POLICY "Anyone can view subscription tiers" ON public.subscription_tiers
  FOR SELECT USING (true);

-- Create a function to update paper count when papers are added/removed
CREATE OR REPLACE FUNCTION update_paper_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET paper_count = paper_count + 1 
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET paper_count = GREATEST(0, paper_count - 1) 
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for paper count (drop first if exists)
DROP TRIGGER IF EXISTS on_paper_change ON public.papers;
CREATE TRIGGER on_paper_change
  AFTER INSERT OR DELETE ON public.papers
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_count();

-- Create storage bucket for avatars (run this separately in Supabase Storage settings if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
