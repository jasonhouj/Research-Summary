-- STEM Stack Database Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders for organizing papers
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Papers table
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  original_filename TEXT,
  file_url TEXT
);

-- Paper summaries
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID REFERENCES public.papers(id) ON DELETE CASCADE,
  hypothesis TEXT,
  introduction TEXT,
  methodology TEXT,
  results JSONB,
  conclusion TEXT,
  key_findings TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can CRUD own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can CRUD own papers" ON public.papers;
DROP POLICY IF EXISTS "Users can view summaries of own papers" ON public.summaries;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for folders
CREATE POLICY "Users can CRUD own folders" ON public.folders 
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for papers
CREATE POLICY "Users can CRUD own papers" ON public.papers 
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for summaries
CREATE POLICY "Users can CRUD summaries of own papers" ON public.summaries 
  FOR ALL USING (paper_id IN (SELECT id FROM public.papers WHERE user_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_papers_user_id ON public.papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_folder_id ON public.papers(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_paper_id ON public.summaries(paper_id);
