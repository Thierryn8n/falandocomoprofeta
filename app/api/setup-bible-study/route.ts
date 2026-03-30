import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // SQL to create the bible study tables
    const sql = `
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
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT,
        audio_url VARCHAR(500),
        transcription TEXT,
        context_snapshot JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE bible_study_panels ENABLE ROW LEVEL SECURITY;
      ALTER TABLE study_cards ENABLE ROW LEVEL SECURITY;
      ALTER TABLE card_connections ENABLE ROW LEVEL SECURITY;
      ALTER TABLE study_interactions ENABLE ROW LEVEL SECURITY;

      -- RLS Policies
      CREATE POLICY "Users can view own bible study panels" ON bible_study_panels FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own bible study panels" ON bible_study_panels FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update own bible study panels" ON bible_study_panels FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete own bible study panels" ON bible_study_panels FOR DELETE USING (auth.uid() = user_id);

      CREATE POLICY "Users can view own study cards" ON study_cards FOR SELECT USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));
      CREATE POLICY "Users can insert own study cards" ON study_cards FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));
      CREATE POLICY "Users can update own study cards" ON study_cards FOR UPDATE USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));
      CREATE POLICY "Users can delete own study cards" ON study_cards FOR DELETE USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));

      CREATE POLICY "Users can view own card connections" ON card_connections FOR SELECT USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));
      CREATE POLICY "Users can insert own card connections" ON card_connections FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));
      CREATE POLICY "Users can delete own card connections" ON card_connections FOR DELETE USING (auth.uid() = (SELECT user_id FROM bible_study_panels WHERE id = panel_id));

      CREATE POLICY "Users can view own study interactions" ON study_interactions FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own study interactions" ON study_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can delete own study interactions" ON study_interactions FOR DELETE USING (auth.uid() = user_id);
    `

    const { error } = await getSupabaseAdmin().rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Setup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Bible study tables created successfully' })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Failed to setup bible study tables' }, { status: 500 })
  }
}
