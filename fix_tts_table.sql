-- CORREÇÃO: Criar tabela de preferências TTS e políticas RLS corretas

-- 1. Criar a tabela (se não existir)
CREATE TABLE IF NOT EXISTS user_tts_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_name TEXT DEFAULT 'pt-BR-Neural2-B',
  voice_type TEXT DEFAULT 'google',
  speech_rate NUMERIC(3,2) DEFAULT 1.00,
  pitch NUMERIC(3,2) DEFAULT 0.00,
  volume NUMERIC(3,2) DEFAULT 1.00,
  auto_advance BOOLEAN DEFAULT true,
  highlight_verse BOOLEAN DEFAULT true,
  pause_between_verses INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_user_tts_preferences_user_id ON user_tts_preferences(user_id);

-- 3. Habilitar RLS
ALTER TABLE user_tts_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can only see their own TTS preferences" ON user_tts_preferences;
DROP POLICY IF EXISTS "Users can insert their own TTS preferences" ON user_tts_preferences;
DROP POLICY IF EXISTS "Users can update their own TTS preferences" ON user_tts_preferences;
DROP POLICY IF EXISTS "Users can delete their own TTS preferences" ON user_tts_preferences;

-- 5. Criar NOVAS políticas RLS (permissivas para o próprio usuário)
CREATE POLICY "Enable read access for own preferences"
  ON user_tts_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert access for own preferences"
  ON user_tts_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update access for own preferences"
  ON user_tts_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete access for own preferences"
  ON user_tts_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_tts_preferences_updated_at ON user_tts_preferences;
CREATE TRIGGER update_user_tts_preferences_updated_at
  BEFORE UPDATE ON user_tts_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Comentário
COMMENT ON TABLE user_tts_preferences IS 'Preferências de Text-to-Speech dos usuários';

-- 8. Verificar se foi criada corretamente
SELECT 'Tabela user_tts_preferences criada/atualizada com sucesso!' as status;
