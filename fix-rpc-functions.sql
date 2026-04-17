-- Dropar funções existentes para evitar erro de tipo de retorno
DROP FUNCTION IF EXISTS increment_question_count(UUID);
DROP FUNCTION IF EXISTS can_user_ask_question(UUID);
DROP FUNCTION IF EXISTS get_user_question_count(UUID);

-- Criar/atualizar função para obter contagem de perguntas do usuário
CREATE OR REPLACE FUNCTION get_user_question_count(p_user_id UUID)
RETURNS TABLE (
  current_count INTEGER,
  max_allowed INTEGER,
  remaining INTEGER,
  can_ask BOOLEAN,
  is_admin BOOLEAN,
  reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_count INTEGER;
  v_max INTEGER := 50;
  v_is_admin BOOLEAN;
  v_limit_date DATE := CURRENT_DATE;
  v_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;

  -- Se for admin, retornar ilimitado
  IF v_is_admin THEN
    RETURN QUERY SELECT 
      0::INTEGER as current_count,
      999999::INTEGER as max_allowed,
      999999::INTEGER as remaining,
      true::BOOLEAN as can_ask,
      true::BOOLEAN as is_admin,
      (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE as reset_at;
    RETURN;
  END IF;

  -- Buscar contagem atual
  SELECT COALESCE(question_count, 0) INTO v_count
  FROM user_question_limits
  WHERE user_id = p_user_id AND limit_date = v_limit_date;

  -- Se não encontrou, contagem é 0
  IF v_count IS NULL THEN
    v_count := 0;
  END IF;

  -- Calcular reset (meia-noite de hoje + 24 horas = meia-noite de amanhã)
  v_reset_at := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;

  RETURN QUERY SELECT 
    v_count as current_count,
    v_max as max_allowed,
    GREATEST(0, v_max - v_count) as remaining,
    (v_count < v_max)::BOOLEAN as can_ask,
    false::BOOLEAN as is_admin,
    v_reset_at as reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar/atualizar função para verificar se usuário pode perguntar
CREATE OR REPLACE FUNCTION can_user_ask_question(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_max INTEGER := 50;
  v_is_admin BOOLEAN;
  v_limit_date DATE := CURRENT_DATE;
BEGIN
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;

  -- Admins podem sempre perguntar
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Buscar contagem atual
  SELECT COALESCE(question_count, 0) INTO v_count
  FROM user_question_limits
  WHERE user_id = p_user_id AND limit_date = v_limit_date;

  -- Se não encontrou, contagem é 0
  IF v_count IS NULL THEN
    v_count := 0;
  END IF;

  -- Retornar true se ainda pode perguntar
  RETURN v_count < v_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar/atualizar função para incrementar contador de perguntas
CREATE OR REPLACE FUNCTION increment_question_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_limit_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO user_question_limits (user_id, question_count, limit_date, updated_at)
  VALUES (p_user_id, 1, v_limit_date, NOW())
  ON CONFLICT (unique_user_daily_limit) 
  DO UPDATE SET 
    question_count = user_question_limits.question_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_question_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_ask_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_question_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_question_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION can_user_ask_question(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_question_count(UUID) TO service_role;

-- Enable RLS on table
ALTER TABLE user_question_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own limits" ON user_question_limits;
DROP POLICY IF EXISTS "Service role can manage all limits" ON user_question_limits;
DROP POLICY IF EXISTS "Users can update their own limits" ON user_question_limits;

-- Create policies
CREATE POLICY "Users can view their own limits"
  ON user_question_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all limits"
  ON user_question_limits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert their own limits"
  ON user_question_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own limits"
  ON user_question_limits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Desabilitar RLS temporariamente para teste (REMOVER EM PRODUÇÃO APÓS TESTE)
-- ALTER TABLE user_question_limits DISABLE ROW LEVEL SECURITY;

-- Test the functions
SELECT 'Testing functions...' as status;

-- Testar inserção manual
SELECT 'Testing insert...' as status;

-- Inserir um registro de teste (substitua USER_UUID pelo seu UUID)
-- INSERT INTO user_question_limits (user_id, question_count, limit_date)
-- VALUES ('SEU_UUID_AQUI', 1, CURRENT_DATE)
-- ON CONFLICT (unique_user_daily_limit) 
-- DO UPDATE SET question_count = user_question_limits.question_count + 1;

-- Verificar se a tabela foi populada
SELECT * FROM user_question_limits LIMIT 5;

-- Show current data
SELECT * FROM user_question_limits LIMIT 5;
