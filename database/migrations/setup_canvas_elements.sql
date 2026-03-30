-- Execute this SQL in your Supabase dashboard to create the canvas_elements table
-- Go to: https://supabase.com/dashboard/project/your-project-id/sql

-- Create canvas_elements table for Miro-style Bible study canvas
CREATE TABLE IF NOT EXISTS canvas_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES bible_study_panels(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'sticky' | 'frame' | 'table' | 'image' | 'doc'
  text TEXT,
  color TEXT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER DEFAULT 180,
  height INTEGER DEFAULT 180,
  data JSONB, -- versículos, revelações, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_canvas_panel ON canvas_elements(panel_id);

-- RLS policies
ALTER TABLE canvas_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own canvas elements"
  ON canvas_elements FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));

CREATE POLICY "Users can insert their own canvas elements"
  ON canvas_elements FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));

CREATE POLICY "Users can update their own canvas elements"
  ON canvas_elements FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));

CREATE POLICY "Users can delete their own canvas elements"
  ON canvas_elements FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));
