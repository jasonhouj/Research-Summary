-- Migration 007: Paper Pages and Section Mappings Tables
-- Run this in Supabase SQL Editor to create the tables for PDF page storage

-- Table to store paper page images (converted from PDF)
CREATE TABLE IF NOT EXISTS public.paper_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID REFERENCES public.papers(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paper_id, page_number)
);

-- Table for section-to-page mapping (for scroll synchronization)
CREATE TABLE IF NOT EXISTS public.section_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_id UUID REFERENCES public.summaries(id) ON DELETE CASCADE NOT NULL,
  section_type TEXT NOT NULL, -- 'hypothesis', 'introduction', 'methodology', 'result_0', 'result_1', 'conclusion'
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL,
  highlight_regions JSONB, -- Optional: [{page: 1, x: 0, y: 100, width: 500, height: 200}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add page_count column to papers table if it doesn't exist
ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS page_count INTEGER;

-- Enable Row Level Security
ALTER TABLE public.paper_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_mappings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can CRUD own paper pages" ON public.paper_pages;
DROP POLICY IF EXISTS "Users can CRUD own section mappings" ON public.section_mappings;

-- RLS Policy for paper_pages: Users can manage pages of their own papers
CREATE POLICY "Users can CRUD own paper pages" ON public.paper_pages
  FOR ALL USING (
    paper_id IN (SELECT id FROM public.papers WHERE user_id = auth.uid())
  );

-- RLS Policy for section_mappings: Users can manage mappings for their own summaries
CREATE POLICY "Users can CRUD own section mappings" ON public.section_mappings
  FOR ALL USING (
    summary_id IN (
      SELECT s.id FROM public.summaries s
      JOIN public.papers p ON s.paper_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_paper_pages_paper_id ON public.paper_pages(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_pages_page_number ON public.paper_pages(paper_id, page_number);
CREATE INDEX IF NOT EXISTS idx_section_mappings_summary_id ON public.section_mappings(summary_id);
