-- =================================================================
-- SCRIPT: Correção do Nome do Usuário na Tabela Profiles
-- Problema: O nome não está sendo preenchido na tabela profiles
-- =================================================================

-- ============================================================
-- 1. REMOVER FUNÇÃO ANTIGA (se existir com problemas)
-- ============================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- 2. CRIAR FUNÇÃO CORRIGIDA - handle_new_user
-- ============================================================
-- Esta função é chamada automaticamente quando um novo usuário 
-- é criado no auth.users, e copia os dados para a tabela profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_email TEXT;
BEGIN
    -- Pegar o email do novo usuário
    v_email := NEW.email;
    
    -- Tentar pegar o full_name dos metadados do usuário (raw_user_meta_data)
    -- O app envia como: options: { data: { full_name: "Nome" } }
    v_full_name := NEW.raw_user_meta_data->>'full_name';
    
    -- Se não encontrou full_name, tentar 'name' (alternativa)
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := NEW.raw_user_meta_data->>'name';
    END IF;
    
    -- Se ainda não tem nome, usar parte do email antes do @
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := split_part(v_email, '@', 1);
    END IF;
    
    -- Debug: Registrar no log o que foi recebido (para troubleshooting)
    RAISE NOTICE 'Creating profile for user: %, full_name: %, raw_meta: %', 
        NEW.id, v_full_name, NEW.raw_user_meta_data;

    -- Inserir na tabela profiles com o nome correto
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
        v_full_name,
        v_email,
        'inactive',
        false,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. CRIAR TRIGGER
-- ============================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. CORRIGIR USUÁRIOS EXISTENTES SEM NOME
-- ============================================================

-- Atualizar usuários que têm NULL no full_name na tabela profiles
UPDATE public.profiles 
SET 
    full_name = COALESCE(
        -- Tentar pegar do raw_user_meta_data
        (SELECT raw_user_meta_data->>'full_name' 
         FROM auth.users 
         WHERE auth.users.id = profiles.id),
        -- Ou do email (parte antes do @)
        split_part(email, '@', 1)
    ),
    updated_at = NOW()
WHERE full_name IS NULL 
   OR full_name = ''
   OR full_name LIKE '%@%'; -- Também corrigir se tiver email completo

-- ============================================================
-- 5. VERIFICAÇÃO: Ver se funcionou
-- ============================================================

SELECT 
    'Usuários com nome preenchido:' as check_type,
    COUNT(*) as count
FROM public.profiles 
WHERE full_name IS NOT NULL AND full_name != ''

UNION ALL

SELECT 
    'Usuários sem nome (NULL ou vazio):' as check_type,
    COUNT(*) as count
FROM public.profiles 
WHERE full_name IS NULL OR full_name = '';

-- ============================================================
-- 6. LISTAR ALGUNS USUÁRIOS PARA VERIFICAÇÃO
-- ============================================================

SELECT 
    id,
    email,
    full_name,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5;

-- Mensagem de sucesso
SELECT '✅ Configuração concluída! A função handle_new_user agora pega o full_name corretamente.' as status;
