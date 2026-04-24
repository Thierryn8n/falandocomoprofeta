-- =====================================================
-- FIX RLS RECURSION - Corrige recursão infinita nas políticas RLS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Erro: infinite recursion detected in policy for relation "class_enrollments"

-- =====================================================
-- 1. PRIMEIRO: Desabilitar RLS em todas as tabelas problemáticas
-- =====================================================

ALTER TABLE IF EXISTS class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_subscriptions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES (para recriar sem recursão)
-- =====================================================

-- Remover políticas de class_enrollments
DROP POLICY IF EXISTS "class_enrollments_select_policy" ON class_enrollments;
DROP POLICY IF EXISTS "class_enrollments_insert_policy" ON class_enrollments;
DROP POLICY IF EXISTS "class_enrollments_update_policy" ON class_enrollments;
DROP POLICY IF EXISTS "class_enrollments_delete_policy" ON class_enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON class_enrollments;

-- Remover políticas de profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Remover políticas de app_config
DROP POLICY IF EXISTS "app_config_select_policy" ON app_config;
DROP POLICY IF EXISTS "app_config_insert_policy" ON app_config;
DROP POLICY IF EXISTS "app_config_update_policy" ON app_config;
DROP POLICY IF EXISTS "Anyone can view app config" ON app_config;
DROP POLICY IF EXISTS "Admins can manage app config" ON app_config;

-- Remover políticas de user_sessions
DROP POLICY IF EXISTS "user_sessions_select_policy" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert_policy" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_update_policy" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;

-- Remover políticas de user_subscriptions
DROP POLICY IF EXISTS "user_subscriptions_select_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_insert_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_update_policy" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;

-- =====================================================
-- 3. RECRIAR POLÍTICAS SEM RECURSÃO (usando auth.uid() diretamente)
-- =====================================================

-- -----------------------------------------------------
-- PROFILES - Políticas simples sem recursão
-- -----------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- Policy para permitir insert durante signup (trigger)
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- -----------------------------------------------------
-- APP_CONFIG - Políticas simples
-- -----------------------------------------------------
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Todos podem ler (dados públicos da aplicação)
CREATE POLICY "app_config_select_all"
ON app_config FOR SELECT
TO PUBLIC
USING (true);

-- Apenas service_role pode modificar (via API/admin)
CREATE POLICY "app_config_modify_service"
ON app_config FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------
-- USER_SESSIONS - Políticas simples
-- -----------------------------------------------------
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_select_own"
ON user_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_sessions_insert_own"
ON user_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_update_own"
ON user_sessions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "user_sessions_delete_own"
ON user_sessions FOR DELETE
USING (user_id = auth.uid());

-- -----------------------------------------------------
-- USER_SUBSCRIPTIONS - Políticas simples
-- -----------------------------------------------------
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions_select_own"
ON user_subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_subscriptions_insert_own"
ON user_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_subscriptions_update_own"
ON user_subscriptions FOR UPDATE
USING (user_id = auth.uid());

-- -----------------------------------------------------
-- CLASS_ENROLLMENTS - Políticas simples (sem verificar profile!)
-- -----------------------------------------------------
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê suas próprias matrículas OU matrículas de turmas que ele administra
CREATE POLICY "class_enrollments_select"
ON class_enrollments FOR SELECT
USING (
  user_id = auth.uid() 
  OR class_id IN (
    SELECT id FROM classes WHERE instructor_id = auth.uid()
  )
);

-- INSERT: usuário só pode se matricular em turmas públicas ou com invite_code
CREATE POLICY "class_enrollments_insert"
ON class_enrollments FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  class_id IN (
    SELECT id FROM classes WHERE is_public = true
  )
);

-- UPDATE: usuário só atualiza sua própria matrícula
CREATE POLICY "class_enrollments_update"
ON class_enrollments FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: usuário só deleta sua própria matrícula
CREATE POLICY "class_enrollments_delete"
ON class_enrollments FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- 4. PERMISSÕES ADICIONAIS PARA SERVICE_ROLE
-- =====================================================

-- Grant all permissions to service_role (para admin panel funcionar)
GRANT ALL ON class_enrollments TO service_role;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON app_config TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON user_subscriptions TO service_role;

-- =====================================================
-- 5. VERIFICAÇÃO
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('class_enrollments', 'profiles', 'app_config', 'user_sessions', 'user_subscriptions')
ORDER BY tablename, policyname;

-- =====================================================
-- 6. TESTE RÁPIDO (descomente para testar)
-- =====================================================
-- SELECT * FROM profiles WHERE id = auth.uid();
-- SELECT * FROM app_config;
