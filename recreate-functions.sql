-- Dropar e recriar funções RPC
DROP FUNCTION IF EXISTS increment_question_count(UUID);
DROP FUNCTION IF EXISTS can_user_ask_question(UUID);
DROP FUNCTION IF EXISTS get_user_question_count(UUID);

-- Função para incrementar contador
CREATE OR REPLACE FUNCTION increment_question_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_limit_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO user_question_limits (user_id, question_count, limit_date, max_questions, created_at, updated_at)
  VALUES (p_user_id, 1, v_limit_date, 50, NOW(), NOW())
  ON CONFLICT ON CONSTRAINT unique_user_daily_limit
  DO UPDATE SET 
    question_count = user_question_limits.question_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se pode perguntar
CREATE OR REPLACE FUNCTION can_user_ask_question(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_max INTEGER := 50;
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Buscar contagem atual
  SELECT COALESCE(question_count, 0) INTO v_count
  FROM user_question_limits
  WHERE user_id = p_user_id AND limit_date = CURRENT_DATE;

  IF v_count IS NULL THEN
    v_count := 0;
  END IF;

  RETURN v_count < v_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter contagem
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
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN QUERY SELECT 
      0::INTEGER, 999999::INTEGER, 999999::INTEGER, true::BOOLEAN, true::BOOLEAN,
      (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  -- Buscar contagem
  SELECT COALESCE(question_count, 0) INTO v_count
  FROM user_question_limits
  WHERE user_id = p_user_id AND limit_date = CURRENT_DATE;

  IF v_count IS NULL THEN
    v_count := 0;
  END IF;

  RETURN QUERY SELECT 
    v_count, 50, GREATEST(0, 50 - v_count), (v_count < 50)::BOOLEAN, false::BOOLEAN,
    (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION increment_question_count(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION can_user_ask_question(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_question_count(UUID) TO authenticated, service_role;

-- Testar
SELECT 'Funções recriadas com sucesso!' as status;
