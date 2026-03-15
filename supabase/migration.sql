-- PhaseThru Database Schema
-- Run this in the Supabase SQL Editor to set up all tables and RLS policies.

-- =============================================================================
-- TABLES
-- =============================================================================

-- Videos: canonical record for each YouTube video
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,                -- YouTube video ID (e.g. "dQw4w9WgXcQ")
  title TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AD Sets: Groups individual descriptions into a single "script" or "contribution"
CREATE TABLE IF NOT EXISTS ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Set',
  author_id TEXT NOT NULL,            -- anonymous session UUID
  user_id UUID REFERENCES auth.users(id), -- Authenticated user ID
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audio Descriptions
CREATE TABLE IF NOT EXISTS audio_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE, -- Link to a set
  time REAL NOT NULL,                 -- trigger timestamp in seconds
  text TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'pause', -- 'pause' or 'duck'
  voice TEXT,
  rate REAL DEFAULT 1.0,
  votes INTEGER NOT NULL DEFAULT 0,
  author_id TEXT NOT NULL,            -- anonymous session UUID
  user_id UUID REFERENCES auth.users(id), -- Authenticated user ID (if logged in)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AD Suggestions: Proposed improvements for specific ADs (usually downvoted ones)
CREATE TABLE IF NOT EXISTS ad_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES audio_descriptions(id) ON DELETE CASCADE,
  suggested_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'applied', 'rejected'
  author_id TEXT NOT NULL,            -- session UUID of the recommender
  user_id UUID REFERENCES auth.users(id), -- Authenticated user ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DIY Steps
CREATE TABLE IF NOT EXISTS diy_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  text TEXT DEFAULT '',
  voice TEXT,
  rate REAL DEFAULT 1.0,
  author_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TBMA Blocks (dialog + action blocks forming a script)
CREATE TABLE IF NOT EXISTS tbma_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  set_id UUID NOT NULL,               -- groups blocks into one TBMA "script"
  block_type TEXT NOT NULL,            -- 'dialog' or 'action'
  time REAL NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  voice TEXT,
  rate REAL DEFAULT 1.0,
  mode TEXT DEFAULT 'pause',
  sort_order INTEGER NOT NULL DEFAULT 0,
  author_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes (one vote per user per AD)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES audio_descriptions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  direction SMALLINT NOT NULL CHECK (direction IN (-1, 1)),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ad_id, voter_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ads_video ON audio_descriptions(video_id);
CREATE INDEX IF NOT EXISTS idx_ads_set ON audio_descriptions(set_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_video ON ad_sets(video_id);
CREATE INDEX IF NOT EXISTS idx_diy_video ON diy_steps(video_id);
CREATE INDEX IF NOT EXISTS idx_tbma_video ON tbma_blocks(video_id);
CREATE INDEX IF NOT EXISTS idx_tbma_set ON tbma_blocks(set_id);
CREATE INDEX IF NOT EXISTS idx_votes_ad ON votes(ad_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_ad ON ad_suggestions(ad_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diy_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbma_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_select" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_insert" ON videos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "videos_update" ON videos FOR UPDATE USING (auth.uid() IS NOT NULL);

-- AD Sets: anyone can read, only auth users can insert/update
CREATE POLICY "ad_sets_select" ON ad_sets FOR SELECT USING (true);
CREATE POLICY "ad_sets_insert" ON ad_sets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ad_sets_update" ON ad_sets FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- Audio descriptions: anyone can read, only auth users can insert, only author can update/delete
CREATE POLICY "ads_select" ON audio_descriptions FOR SELECT USING (true);
CREATE POLICY "ads_insert" ON audio_descriptions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ads_update" ON audio_descriptions FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "ads_delete" ON audio_descriptions FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- DIY steps: anyone can read, only auth users can insert, only author can update/delete
CREATE POLICY "diy_select" ON diy_steps FOR SELECT USING (true);
CREATE POLICY "diy_insert" ON diy_steps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "diy_update" ON diy_steps FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "diy_delete" ON diy_steps FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- TBMA blocks: anyone can read, only auth users can insert, only author can update/delete
CREATE POLICY "tbma_select" ON tbma_blocks FOR SELECT USING (true);
CREATE POLICY "tbma_insert" ON tbma_blocks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tbma_update" ON tbma_blocks FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "tbma_delete" ON tbma_blocks FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- AD Suggestions: Anyone can read, only auth users can insert suggestions
CREATE POLICY "suggestions_select" ON ad_suggestions FOR SELECT USING (true);
CREATE POLICY "suggestions_insert" ON ad_suggestions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "suggestions_update" ON ad_suggestions FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid()));

-- Votes: anyone can read, only auth users can insert, only voter can update their own vote
CREATE POLICY "votes_select" ON votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "votes_update" ON votes FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
  
-- Add set_id vote support to the votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE;
-- Update unique constraint to handle either ad_id OR set_id
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_ad_id_voter_id_key;
-- Note: In a real migration we'd handle the unique constraint carefully.
-- For now, we'll allow one vote per voter per (ad OR set).
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_voter_ad_set ON votes (voter_id, ad_id) WHERE ad_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_voter_set ON votes (voter_id, set_id) WHERE set_id IS NOT NULL;
