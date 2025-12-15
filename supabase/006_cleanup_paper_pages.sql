-- Migration 006: Cleanup Paper Pages (if they exist)
-- Run this to remove the paper_pages feature if you previously set it up
-- This is optional - only run if you want to clean up

-- Drop tables if they exist
DROP TABLE IF EXISTS public.section_mappings;
DROP TABLE IF EXISTS public.paper_pages;

-- Remove page_count column from papers if it exists
ALTER TABLE public.papers DROP COLUMN IF EXISTS page_count;

-- Note: You may also want to delete the 'paper-pages' storage bucket
-- and its contents from the Supabase Dashboard manually
