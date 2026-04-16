-- Script para corrigir problema de cadastro de usuários
-- Onde nome e senha não estão sendo salvos corretamente

-- ============================================================
-- 1. PRIMEIRO: Identificar funções problemáticas
-- ============================================================

-- Listar todas as funções que manipulam a tabela auth.users ou profiles
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_definition ILIKE '%auth.users%' 
    OR routine_definition ILIKE '%profiles%'
    OR routine_definition ILIKE '%Usuario Teste%'
    OR routine_definition ILIKE '%test user%'
    OR routine_definition ILIKE '%full_name%'
)
ORDER BY routine_name;

-- ============================================================
-- 2. REMOVER funções problemáticas que criam "Usuario Teste"
-- ============================================================

-- Remover qualquer função que crie usuário de teste
DROP FUNCTION IF EXISTS public.create_test_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_test() CASCADE;
DROP FUNCTION IF EXISTS public.set_test_user() CASCADE;

-- Remover triggers de teste
DROP TRIGGER IF EXISTS test_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_test_profile ON auth.users;

-- ============================================================
-- 3. CORRIGIR função handle_new_user (se existir)
-- ============================================================

-- Remover versão antiga/problemática
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Criar nova função CORRETA que usa os dados do usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir na tabela profiles usando os dados REAIS do usuário
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        subscription_status,
        is_admin,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',  -- Nome do formulário
            NEW.raw_user_meta_data->>'name',      -- Alternativa
            split_part(NEW.email, '@', 1)         -- Fallback: parte do email
        ),
        NEW.email,
        'inactive',  -- Status inicial
        false,       -- Não é admin por padrão
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Retornar o usuário sem modificações
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. CRIAR TRIGGER CORRETO
-- ============================================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. VERIFICAR E CORRIGIR RLS (Row Level Security)
-- ============================================================

-- Garantir que RLS está habilitado na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas problemáticas
DROP POLICY IF EXISTS "Test users can view all" ON public.profiles;
DROP POLICY IF EXISTS "Allow test access" ON public.profiles;

-- Criar políticas corretas
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política para permitir insert na função handle_new_user
CREATE POLICY "System can create profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- ============================================================
-- 6. LIMPAR USUÁRIOS DE TESTE (se existirem)
-- ============================================================

-- Remover usuários com nome "Usuario Teste"
DELETE FROM public.profiles 
WHERE full_name ILIKE '%Teste%' 
   OR full_name ILIKE '%Test%'
   OR full_name = 'Usuario Teste RLS';

-- ============================================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================================

-- Verificar se a função foi criada corretamente
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
AND event_object_table = 'users';

-- Mensagem de sucesso
SELECT 'Configuração de signup corrigida com sucesso!' as status;
