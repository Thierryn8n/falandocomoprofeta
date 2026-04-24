-- Criar tabela de preferências de Text-to-Speech (TTS)
CREATE TABLE IF NOT EXISTS user_tts_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Configurações de voz
  voice_name TEXT DEFAULT 'pt-BR-Neural2-B', -- pt-BR-Neural2-B (homem), pt-BR-Neural2-A (mulher), etc
  voice_type TEXT DEFAULT 'google', -- 'google' ou 'browser'
  -- Configurações de fala
  speech_rate NUMERIC(3,2) DEFAULT 1.00, -- 0.25 a 4.0
  pitch NUMERIC(3,2) DEFAULT 0.00, -- -20.0 a 20.0
  volume NUMERIC(3,2) DEFAULT 1.00, -- 0.0 a 1.0
  -- Preferências adicionais
  auto_advance BOOLEAN DEFAULT true, -- Avançar capítulo automaticamente
  highlight_verse BOOLEAN DEFAULT true, -- Destacar versículo durante leitura
  pause_between_verses INTEGER DEFAULT 300, -- Milissegundos
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Garante que cada usuário tem apenas uma configuração
  UNIQUE(user_id)
);

-- Índice para buscar configurações do usuário
CREATE INDEX IF NOT EXISTS idx_user_tts_preferences_user_id ON user_tts_preferences(user_id);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_tts_preferences_updated_at ON user_tts_preferences;
CREATE TRIGGER update_user_tts_preferences_updated_at
  BEFORE UPDATE ON user_tts_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentário da tabela
COMMENT ON TABLE user_tts_preferences IS 'Preferências de Text-to-Speech dos usuários';

-- Política RLS (permitir usuário ver/apenas suas próprias configurações)
ALTER TABLE user_tts_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see their own TTS preferences" ON user_tts_preferences;
CREATE POLICY "Users can only see their own TTS preferences"
  ON user_tts_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- Inserir configuração padrão para usuários existentes (opcional)
-- INSERT INTO user_tts_preferences (user_id) 
-- SELECT id FROM profiles 
-- WHERE id NOT IN (SELECT user_id FROM user_tts_preferences);
