-- Migration 005: Fix Summaries RLS Policies
-- Run this in Supabase SQL Editor to allow full CRUD on summaries

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view summaries of own papers" ON public.summaries;

-- Create comprehensive policy for all operations on summaries
-- Users can INSERT, SELECT, UPDATE, DELETE summaries for their own papers
CREATE POLICY "Users can CRUD summaries of own papers" ON public.summaries 
  FOR ALL USING (paper_id IN (SELECT id FROM public.papers WHERE user_id = auth.uid()));
