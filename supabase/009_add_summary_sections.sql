-- Add new columns to summaries table for detailed section data
-- Run this in Supabase SQL Editor

-- Add method_sections for detailed methodology breakdown
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS method_sections JSONB DEFAULT '[]';

-- Add results_sections for individual result items from document_summary
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS results_sections JSONB DEFAULT '[]';

-- Add discussion_sections for individual discussion items from document_summary
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS discussion_sections JSONB DEFAULT '[]';

-- Add gaps_and_limitations from the gaps_and_limitations node
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS gaps_and_limitations JSONB DEFAULT '[]';

-- Add terminology_to_clarify column if it doesn't exist (may already exist)
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS terminology_to_clarify JSONB DEFAULT '[]';

-- Add comments for documentation
COMMENT ON COLUMN public.summaries.method_sections IS 'Array of {subsection_title, description} from method_and_materials node';
COMMENT ON COLUMN public.summaries.results_sections IS 'Array of {section_title, subsection_title, content} from document_summary node - Results sections';
COMMENT ON COLUMN public.summaries.discussion_sections IS 'Array of {section_title, subsection_title, content} from document_summary node - Discussion sections';
COMMENT ON COLUMN public.summaries.gaps_and_limitations IS 'Array of {issue, reason} from gaps_and_limitations node';
COMMENT ON COLUMN public.summaries.terminology_to_clarify IS 'Array of {term, explanation} from terminology_to_clarify node';
