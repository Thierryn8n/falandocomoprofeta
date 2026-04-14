-- =====================================================
-- FIX: Corrigir recursão infinita nas políticas RLS
-- =====================================================

-- Remover todas as políticas problemáticas da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar política simples: usuários só veem/editam seu próprio perfil
-- SEM verificação de admin (que causa recursão)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para deletes (se necessário)
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- FIX: Corrigir recursão em outras tabelas (conversations, messages)
-- =====================================================

-- Remover políticas de admin que causam recursão
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

-- Criar função segura para verificar admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Usar security definer para ignorar RLS
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar políticas de admin usando a função (não causa recursão)
CREATE POLICY "Admins can view all conversations" ON public.conversations
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all messages" ON public.messages
    FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- FIX: Corrigir outras tabelas com mesmo problema
-- =====================================================

-- Analytics: remover e recriar sem recursão
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics;
DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins can view heresy logs" ON public.heresy_logs;
DROP POLICY IF EXISTS "Admins can manage api keys" ON public.api_keys;

CREATE POLICY "Admins can view analytics" ON public.analytics
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view system logs" ON public.system_logs
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view heresy logs" ON public.heresy_logs
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage api keys" ON public.api_keys
    FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Listar políticas atualizadas
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Testar se a função is_admin funciona
SELECT public.is_admin('9c31c457-af69-4422-a40e-0d473c9baa35') as is_admin_result;
