-- Migration 006: Paper Pages Storage Bucket Policies
-- Run this in Supabase SQL Editor after creating the 'paper-pages' bucket in the Dashboard
--
-- IMPORTANT: First create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in your Supabase project
-- 2. Create a new bucket named "paper-pages"
-- 3. Set it as a PUBLIC bucket (for easy image loading)
-- 4. Then run this SQL to set up the policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own paper pages" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own paper pages" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own paper pages" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view paper pages" ON storage.objects;

-- Allow authenticated users to upload paper pages to their folder
-- Path format: {user_id}/{paper_id}/page-{number}.webp
CREATE POLICY "Users can upload own paper pages" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'paper-pages' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own paper pages
CREATE POLICY "Users can update own paper pages" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'paper-pages' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own paper pages
CREATE POLICY "Users can delete own paper pages" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'paper-pages' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to view paper pages (public bucket for image loading)
CREATE POLICY "Anyone can view paper pages" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'paper-pages');
