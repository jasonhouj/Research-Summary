-- Drop existing tables if they exist (run this first if you need to recreate)
DROP TABLE IF EXISTS saved_papers CASCADE;
DROP TABLE IF EXISTS saved_paper_categories CASCADE;

-- Create saved_paper_categories table for organizing saved papers
CREATE TABLE IF NOT EXISTS saved_paper_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'gray',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_paper_categories_user_id ON saved_paper_categories(user_id);

-- Enable Row Level Security
ALTER TABLE saved_paper_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view their own saved paper categories"
    ON saved_paper_categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved paper categories"
    ON saved_paper_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved paper categories"
    ON saved_paper_categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved paper categories"
    ON saved_paper_categories FOR DELETE
    USING (auth.uid() = user_id);

-- Create saved_papers table for storing papers users want to read later
CREATE TABLE IF NOT EXISTS saved_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES saved_paper_categories(id) ON DELETE SET NULL,
    openalex_id TEXT NOT NULL,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    abstract TEXT,
    url TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'OpenAlex',
    published_date TEXT,
    doi TEXT,
    citation_count INTEGER,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure a user can't save the same paper twice
    UNIQUE(user_id, openalex_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_papers_user_id ON saved_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_papers_category_id ON saved_papers(category_id);
CREATE INDEX IF NOT EXISTS idx_saved_papers_saved_at ON saved_papers(saved_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own saved papers
CREATE POLICY "Users can view their own saved papers"
    ON saved_papers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved papers"
    ON saved_papers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved papers"
    ON saved_papers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved papers"
    ON saved_papers FOR DELETE
    USING (auth.uid() = user_id);
