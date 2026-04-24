-- Adicionar colunas de tema e fonte na tabela user_tts_preferences

-- Adicionar colunas se não existirem
ALTER TABLE user_tts_preferences 
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'sepia',
  ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'serif',
  ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium';

-- Atualizar políticas RLS para permitir atualização dessas colunas
DROP POLICY IF EXISTS "Users can update their own tts preferences" ON user_tts_preferences;
CREATE POLICY "Users can update their own tts preferences"
  ON user_tts_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- Verificar as colunas
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_tts_preferences';
