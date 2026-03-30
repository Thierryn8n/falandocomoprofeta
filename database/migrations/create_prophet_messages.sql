-- Migration: Create Prophet Messages Table
-- Description: Table for storing William Branham's messages for AI analysis

CREATE TABLE IF NOT EXISTS prophet_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  bible_references TEXT[], -- Array of Bible references mentioned in the message
  themes TEXT[], -- Array of themes/topics covered
  message_date DATE,
  location VARCHAR(255),
  transcript_url TEXT,
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prophet_messages_title ON prophet_messages(title);
CREATE INDEX IF NOT EXISTS idx_prophet_messages_themes ON prophet_messages USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_prophet_messages_bible_refs ON prophet_messages USING GIN(bible_references);

-- RLS (Row Level Security) - Allow public read access for AI analysis
ALTER TABLE prophet_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prophet messages" ON prophet_messages
  FOR SELECT USING (true);

-- Insert sample messages (optional - can be removed later)
INSERT INTO prophet_messages (title, content, bible_references, themes, message_date, location) VALUES
(
  'The Seven Church Ages',
  'In this message, Brother Branham explains the seven church ages from Revelation 2-3, showing how each age represents a period in church history...',
  ARRAY['Revelation 2-3', 'Revelation 1:19', 'Daniel 7'],
  ARRAY['Church History', 'Revelation', 'End Times', 'Prophecy'],
  '1960-12-04',
  'Jeffersonville, Indiana'
),
(
  'The Serpent Seed',
  'This message reveals the truth about the serpent seed in Genesis 3:15, explaining the lineage of Satan...',
  ARRAY['Genesis 3:15', 'Genesis 4', 'Matthew 13'],
  ARRAY['Original Sin', 'Serpent Seed', 'Genesis', 'Fall of Man'],
  '1958-09-28',
  'Jeffersonville, Indiana'
),
(
  'The Voice of the Sign',
  'Brother Branham explains how God speaks through signs and wonders in this end-time message...',
  ARRAY['Hebrews 2:4', 'Mark 16:17', 'Acts 2:19'],
  ARRAY['Signs', 'End Times', 'Healing', 'Supernatural'],
  '1964-03-06',
  'Phoenix, Arizona'
);
