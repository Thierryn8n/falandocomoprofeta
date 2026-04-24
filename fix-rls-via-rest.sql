-- =====================================================
-- FIX RLS RECURSION - Execute no SQL Editor do Supabase
-- Acesse: https://supabase.com/dashboard/project/wlwwgnimfuvoxjecdnza/sql-editor
-- =====================================================

-- 1. DESABILITAR RLS EM TODAS AS TABELAS PROBLEMÁTICAS
ALTER TABLE IF EXISTS class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS heresy_logs DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES DE class_enrollments
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

-- 3. REABILITAR RLS COM POLÍTICAS SIMPLES (sem recursão)
-- POLÍTICAS PARA profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- POLÍTICAS PARA app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_select_all"
ON app_config FOR SELECT
TO PUBLIC
USING (true);

-- POLÍTICAS PARA user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_select_own"
ON user_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_sessions_insert_anon"
ON user_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- POLÍTICAS PARA user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions_select_own"
ON user_subscriptions FOR SELECT
USING (user_id = auth.uid());

-- POLÍTICAS PARA class_enrollments (SEM verificar is_admin!)
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_enrollments_select"
ON class_enrollments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "class_enrollments_insert"
ON class_enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());

-- POLÍTICAS PARA heresy_logs
ALTER TABLE heresy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "heresy_logs_select_all"
ON heresy_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "heresy_logs_insert_anon"
ON heresy_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);
