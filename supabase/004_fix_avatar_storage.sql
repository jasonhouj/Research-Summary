-- Migration 004: Fix Avatar Storage RLS
-- Run this in Supabase SQL Editor

-- First, create the avatars bucket if it doesn't exist
-- Note: You may need to create the bucket manually in Supabase Dashboard > Storage
-- Click "New Bucket", name it "avatars", and set it to Public

-- Storage policies for avatars bucket
-- These allow authenticated users to upload and manage their own avatars

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
