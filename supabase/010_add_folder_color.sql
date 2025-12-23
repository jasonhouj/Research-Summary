-- Add color column to folders table
-- Run this in Supabase SQL Editor

ALTER TABLE public.folders
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'gray';

-- Add comment for documentation
COMMENT ON COLUMN public.folders.color IS 'Folder color: gray, red, orange, amber, green, teal, blue, purple, pink';
