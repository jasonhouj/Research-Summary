-- Add conflict_of_interest column to summaries table
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS conflict_of_interest TEXT;

-- Comment for documentation
COMMENT ON COLUMN public.summaries.conflict_of_interest IS 'Summary of conflict of interest disclosures from the paper';
