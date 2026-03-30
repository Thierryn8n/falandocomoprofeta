-- Migration: Create Bible Study Panels System
-- Description: Tables for interactive Bible study panels with cards and connections

-- Table for Bible Study Panels
CREATE TABLE IF NOT EXISTS bible_study_panels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bible_version VARCHAR(50) DEFAULT 'King James 1611',
  prophet_assistance BOOLEAN DEFAULT true,
  theme VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Study Cards
CREATE TABLE IF NOT EXISTS study_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  panel_id UUID REFERENCES bible_study_panels(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  card_type VARCHAR(50) DEFAULT 'verse' CHECK (card_type IN ('verse', 'concept', 'question', 'answer', 'connection', 'note')),
  position_x DECIMAL(10, 2) DEFAULT 0,
  position_y DECIMAL(10, 2) DEFAULT 0,
  width DECIMAL(10, 2) DEFAULT 200,
  height DECIMAL(10, 2) DEFAULT 150,
  color VARCHAR(20) DEFAULT '#ffffff',
  bible_reference TEXT,
  prophet_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Card Connections
CREATE TABLE IF NOT EXISTS card_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  panel_id UUID REFERENCES bible_study_panels(id) ON DELETE CASCADE,
  from_card_id UUID REFERENCES study_cards(id) ON DELETE CASCADE,
  to_card_id UUID REFERENCES study_cards(id) ON DELETE CASCADE,
  connection_type VARCHAR(50) DEFAULT 'related' CHECK (connection_type IN ('related', 'causes', 'leads_to', 'explains', 'contrasts')),
  label VARCHAR(255),
  color VARCHAR(20) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_card_id, to_card_id)
);

-- Table for Study Questions and Answers
CREATE TABLE IF NOT EXISTS study_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  panel_id UUID REFERENCES bible_study_panels(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  audio_url TEXT,
  cards_generated JSONB DEFAULT '[]',
  context_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bible_study_panels_user_id ON bible_study_panels(user_id);
CREATE INDEX IF NOT EXISTS idx_study_cards_panel_id ON study_cards(panel_id);
CREATE INDEX IF NOT EXISTS idx_card_connections_panel_id ON card_connections(panel_id);
CREATE INDEX IF NOT EXISTS idx_study_interactions_panel_id ON study_interactions(panel_id);

-- RLS (Row Level Security) Policies
ALTER TABLE bible_study_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_interactions ENABLE ROW LEVEL SECURITY;

-- Policy for bible_study_panels
CREATE POLICY "Users can view their own panels" ON bible_study_panels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own panels" ON bible_study_panels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own panels" ON bible_study_panels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own panels" ON bible_study_panels
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for study_cards
CREATE POLICY "Users can view cards from their panels" ON study_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bible_study_panels 
      WHERE bible_study_panels.id = study_cards.panel_id 
      AND bible_study_panels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage cards in their panels" ON study_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bible_study_panels 
      WHERE bible_study_panels.id = study_cards.panel_id 
      AND bible_study_panels.user_id = auth.uid()
    )
  );

-- Policy for card_connections
CREATE POLICY "Users can view connections from their panels" ON card_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bible_study_panels 
      WHERE bible_study_panels.id = card_connections.panel_id 
      AND bible_study_panels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage connections in their panels" ON card_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bible_study_panels 
      WHERE bible_study_panels.id = card_connections.panel_id 
      AND bible_study_panels.user_id = auth.uid()
    )
  );

-- Policy for study_interactions
CREATE POLICY "Users can view interactions from their panels" ON study_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bible_study_panels 
      WHERE bible_study_panels.id = study_interactions.panel_id 
      AND bible_study_panels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create interactions in their panels" ON study_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bible_study_panels 
      WHERE bible_study_panels.id = study_interactions.panel_id 
      AND bible_study_panels.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_bible_study_panels_updated_at 
  BEFORE UPDATE ON bible_study_panels 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_cards_updated_at 
  BEFORE UPDATE ON study_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
