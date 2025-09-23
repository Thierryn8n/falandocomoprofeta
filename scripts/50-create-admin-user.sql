-- Script para configurar usuário admin e atualizar tabelas
-- IMPORTANTE: Substitua 'SEU_UUID_AQUI' pelo UUID do usuário que você quer tornar admin

-- Primeiro, você precisa descobrir seu UUID
SELECT 'Usuários existentes:' as info;
SELECT id, email, COALESCE(role, 'user') as role, created_at 
FROM public.profiles 
ORDER BY created_at;

-- Criar usuário administrador
-- Substitua 'SEU_UUID_AQUI' pelo UUID do seu usuário

-- Verificar usuários existentes
SELECT id, email, role FROM public.profiles ORDER BY created_at;

-- Atualizar usuário para admin (substitua o UUID)
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = 'SEU_UUID_AQUI';

-- Verificar se o usuário foi atualizado
SELECT id, email, role, created_at, updated_at 
FROM public.profiles 
WHERE role = 'admin';

-- PASSO 1: Descomente e execute a linha abaixo substituindo SEU_UUID_AQUI pelo seu UUID real
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'SEU_UUID_AQUI';

-- PASSO 2: Execute o resto do script após definir o admin
DO $$
DECLARE
    admin_uuid UUID;
    admin_count INTEGER;
    updated_count INTEGER;
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Verificar se existe um usuário admin
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'ERRO: Nenhum usuário admin encontrado! Execute primeiro: UPDATE public.profiles SET role = ''admin'' WHERE id = ''SEU_UUID_AQUI'';';
    END IF;
    
    -- Obter o ID do admin
    SELECT id INTO admin_uuid FROM public.profiles WHERE role = 'admin' LIMIT 1;
    
    -- Atualizar tabela documents se existir e tiver coluna admin_id
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') INTO table_exists;
    IF table_exists THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'admin_id' AND table_schema = 'public') INTO column_exists;
        IF column_exists THEN
            UPDATE public.documents SET admin_id = admin_uuid WHERE admin_id IS NULL;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
        END IF;
    END IF;
    
    -- Atualizar tabela app_config se existir e tiver coluna admin_id
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_config' AND table_schema = 'public') INTO table_exists;
    IF table_exists THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_config' AND column_name = 'admin_id' AND table_schema = 'public') INTO column_exists;
        IF column_exists THEN
            UPDATE public.app_config SET admin_id = admin_uuid WHERE admin_id IS NULL;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
        END IF;
    END IF;
    
    -- Atualizar tabela api_keys se existir e tiver coluna admin_id
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys' AND table_schema = 'public') INTO table_exists;
    IF table_exists THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'admin_id' AND table_schema = 'public') INTO column_exists;
        IF column_exists THEN
            UPDATE public.api_keys SET admin_id = admin_uuid WHERE admin_id IS NULL;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
        END IF;
    END IF;
    
    -- Atualizar tabela heresy_responses se existir e tiver coluna admin_id
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'heresy_responses' AND table_schema = 'public') INTO table_exists;
    IF table_exists THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'heresy_responses' AND column_name = 'admin_id' AND table_schema = 'public') INTO column_exists;
        IF column_exists THEN
            EXECUTE format('UPDATE public.heresy_responses SET admin_id = %L WHERE admin_id IS NULL', admin_uuid);
            GET DIAGNOSTICS updated_count = ROW_COUNT;
        END IF;
    END IF;
    
    -- Atualizar tabela heresy_logs se existir e tiver coluna admin_id
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'heresy_logs' AND table_schema = 'public') INTO table_exists;
    IF table_exists THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'heresy_logs' AND column_name = 'admin_id' AND table_schema = 'public') INTO column_exists;
        IF column_exists THEN
            EXECUTE format('UPDATE public.heresy_logs SET admin_id = %L WHERE admin_id IS NULL', admin_uuid);
            GET DIAGNOSTICS updated_count = ROW_COUNT;
        END IF;
    END IF;
    
    -- Atualizar tabela system_logs se existir e tiver coluna admin_id
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs' AND table_schema = 'public') INTO table_exists;
    IF table_exists THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'admin_id' AND table_schema = 'public') INTO column_exists;
        IF column_exists THEN
            UPDATE public.system_logs SET admin_id = admin_uuid WHERE admin_id IS NULL;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
        END IF;
    END IF;
    
    -- Atualizar registros existentes com o admin_id
    IF admin_uuid IS NOT NULL THEN
        -- Atualizar app_config
        UPDATE public.app_config SET admin_id = admin_uuid WHERE admin_id IS NULL;
        
        -- Atualizar api_keys
        UPDATE public.api_keys SET admin_id = admin_uuid WHERE admin_id IS NULL;
        
        -- Atualizar documents
        UPDATE public.documents SET admin_id = admin_uuid WHERE admin_id IS NULL;
        
        -- Atualizar heresy_responses
        UPDATE public.heresy_responses SET admin_id = admin_uuid WHERE admin_id IS NULL;
    END IF;
END $$;

-- Inserir ou atualizar chave Gemini no banco de dados com o admin_id
DO $$
DECLARE
    admin_uuid UUID;
    existing_key_count INTEGER;
    column_exists BOOLEAN;
BEGIN
    -- Obter o ID do admin
    SELECT id INTO admin_uuid FROM public.profiles WHERE role = 'admin' LIMIT 1;
    
    IF admin_uuid IS NULL THEN
        RAISE EXCEPTION 'ERRO: Admin não encontrado! Execute o UPDATE acima primeiro.';
    END IF;
    
    -- Verificar se a tabela api_keys existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'ERRO: Tabela api_keys não encontrada!';
    END IF;
    
    -- Verificar se a coluna admin_id existe
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'admin_id' AND table_schema = 'public') INTO column_exists;
    
    -- Verificar se já existe uma chave Gemini
    SELECT COUNT(*) INTO existing_key_count FROM public.api_keys WHERE provider = 'gemini';
    
    IF existing_key_count = 0 THEN
        -- Inserir nova chave Gemini
        IF column_exists THEN
            INSERT INTO public.api_keys (
                id,
                provider, 
                key_name, 
                key_value, 
                is_active, 
                admin_id,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'gemini', 
                'GEMINI_API_KEY', 
                'SUA_CHAVE_GEMINI_AQUI', 
                true, 
                admin_uuid,
                NOW(),
                NOW()
            );
        ELSE
            INSERT INTO public.api_keys (
                id,
                provider, 
                key_name, 
                key_value, 
                is_active,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'gemini', 
                'GEMINI_API_KEY', 
                'SUA_CHAVE_GEMINI_AQUI', 
                true,
                NOW(),
                NOW()
            );
        END IF;
    ELSE
        -- Atualizar chave existente
        IF column_exists THEN
            UPDATE public.api_keys 
            SET admin_id = admin_uuid,
                is_active = true,
                updated_at = NOW()
            WHERE provider = 'gemini';
        ELSE
            UPDATE public.api_keys 
            SET is_active = true,
                updated_at = NOW()
            WHERE provider = 'gemini';
        END IF;
    END IF;
END $$;

-- Mostrar status final
SELECT 'Status Final:' as info;

SELECT 
    'ADMIN USER' as tipo,
    id::text,
    email,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE role = 'admin'

UNION ALL

SELECT 
    'API KEYS' as tipo,
    id::text,
    provider as email,
    CASE WHEN is_active THEN 'active' ELSE 'inactive' END as role,
    created_at,
    updated_at
FROM public.api_keys
ORDER BY tipo, created_at;

-- Verificar colunas admin_id criadas
SELECT 'Colunas admin_id criadas:' as info;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'admin_id' 
AND table_schema = 'public'
ORDER BY table_name;
