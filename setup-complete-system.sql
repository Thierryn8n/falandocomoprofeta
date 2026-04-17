-- ============================================
-- SISTEMA COMPLETO DE CONTABILIZAÇÃO DE TOKENS
-- ============================================

-- 1. GARANTIR QUE RLS ESTÁ DESABILITADO (temporariamente para teste)
ALTER TABLE user_question_limits DISABLE ROW LEVEL SECURITY;

-- 2. FUNÇÃO PARA NOVO USUÁRIO - GANHA 50 TOKENS AO CADASTRAR
CREATE OR REPLACE FUNCTION handle_new_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir 50 tokens gratuitos para o novo usuário
  INSERT INTO user_question_limits (user_id, question_count, limit_date, max_questions, created_at, updated_at)
  VALUES (NEW.id, 0, CURRENT_DATE, 50, NOW(), NOW())
  ON CONFLICT ON CONSTRAINT unique_user_daily_limit
  DO NOTHING; -- Se já existir, não faz nada
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER PARA NOVOS USUÁRIOS
DROP TRIGGER IF EXISTS on_auth_user_created_tokens ON auth.users;
CREATE TRIGGER on_auth_user_created_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_tokens();

-- 4. RECRIAR FUNÇÃO DE INCREMENTO (garantir que funcione)
DROP FUNCTION IF EXISTS increment_question_count(UUID);
CREATE OR REPLACE FUNCTION increment_question_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_limit_date DATE := CURRENT_DATE;
  v_exists BOOLEAN;
BEGIN
  -- Verificar se já existe registro para hoje
  SELECT EXISTS(
    SELECT 1 FROM user_question_limits 
    WHERE user_id = p_user_id AND limit_date = v_limit_date
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Atualizar contagem existente
    UPDATE user_question_limits 
    SET question_count = question_count + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id AND limit_date = v_limit_date;
  ELSE
    -- Criar novo registro com 1 pergunta
    INSERT INTO user_question_limits (user_id, question_count, limit_date, max_questions, created_at, updated_at)
    VALUES (p_user_id, 1, v_limit_date, 50, NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PARA OBTER CONTAGEM (com cálculo correto de restantes)
DROP FUNCTION IF EXISTS get_user_question_count(UUID);
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
  v_count INTEGER := 0;
  v_is_admin BOOLEAN := false;
BEGIN
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;

  -- Se for admin, retornar ilimitado
  IF v_is_admin THEN
    RETURN QUERY SELECT 
      0::INTEGER, 999999::INTEGER, 999999::INTEGER, 
      true::BOOLEAN, true::BOOLEAN,
      (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  -- Buscar contagem de hoje
  SELECT COALESCE(question_count, 0) INTO v_count
  FROM user_question_limits
  WHERE user_id = p_user_id AND limit_date = CURRENT_DATE;

  -- Retornar dados
  RETURN QUERY SELECT 
    v_count,
    50,
    GREATEST(0, 50 - v_count),
    (v_count < 50)::BOOLEAN,
    false::BOOLEAN,
    (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA VERIFICAR SE PODE PERGUNTAR
DROP FUNCTION IF EXISTS can_user_ask_question(UUID);
CREATE OR REPLACE FUNCTION can_user_ask_question(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER := 0;
  v_is_admin BOOLEAN := false;
BEGIN
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Buscar contagem
  SELECT COALESCE(question_count, 0) INTO v_count
  FROM user_question_limits
  WHERE user_id = p_user_id AND limit_date = CURRENT_DATE;

  RETURN v_count < 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION increment_question_count(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION can_user_ask_question(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION get_user_question_count(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION handle_new_user_tokens() TO authenticated, service_role, anon;

-- 8. PREENCHER USUÁRIOS EXISTENTES QUE NÃO TÊM TOKENS
INSERT INTO user_question_limits (user_id, question_count, limit_date, max_questions, created_at, updated_at)
SELECT 
  au.id,
  0,
  CURRENT_DATE,
  50,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN user_question_limits uql ON au.id = uql.user_id AND uql.limit_date = CURRENT_DATE
WHERE uql.id IS NULL;

-- 9. TESTAR FUNÇÕES
SELECT 'Sistema configurado!' as status;
SELECT * FROM get_user_question_count('8c2bc427-030e-4ee2-851e-8fcc31bd2ee3');
