-- Script para corrigir inconsistência entre nomes de colunas na tabela api_keys
-- Este script padroniza o uso de 'encrypted_key' em toda a aplicação

-- Verificar estrutura atual da tabela
SELECT 'Estrutura atual da tabela api_keys:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'api_keys' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se existe coluna key_value (versão antiga)
DO $$
DECLARE
    has_key_value BOOLEAN;
    has_encrypted_key BOOLEAN;
BEGIN
    -- Verificar se existe key_value
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'api_keys' 
        AND column_name = 'key_value' 
        AND table_schema = 'public'
    ) INTO has_key_value;
    
    -- Verificar se existe encrypted_key
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'api_keys' 
        AND column_name = 'encrypted_key' 
        AND table_schema = 'public'
    ) INTO has_encrypted_key;
    
    RAISE NOTICE 'Coluna key_value existe: %', has_key_value;
    RAISE NOTICE 'Coluna encrypted_key existe: %', has_encrypted_key;
    
    -- Se temos key_value mas não encrypted_key, renomear
    IF has_key_value AND NOT has_encrypted_key THEN
        ALTER TABLE public.api_keys RENAME COLUMN key_value TO encrypted_key;
        RAISE NOTICE 'Coluna key_value renomeada para encrypted_key';
    END IF;
    
    -- Se temos ambas, migrar dados e remover key_value
    IF has_key_value AND has_encrypted_key THEN
        UPDATE public.api_keys 
        SET encrypted_key = key_value 
        WHERE encrypted_key IS NULL OR encrypted_key = '';
        
        ALTER TABLE public.api_keys DROP COLUMN key_value;
        RAISE NOTICE 'Dados migrados de key_value para encrypted_key e coluna key_value removida';
    END IF;
    
    -- Se não temos nenhuma, criar encrypted_key
    IF NOT has_key_value AND NOT has_encrypted_key THEN
        ALTER TABLE public.api_keys ADD COLUMN encrypted_key TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Coluna encrypted_key criada';
    END IF;
END $$;

-- Atualizar a chave Gemini com a chave do .env se ela ainda não estiver configurada
DO $$
DECLARE
    gemini_key_count INTEGER;
    admin_uuid UUID;
BEGIN
    -- Obter admin ID
    SELECT id INTO admin_uuid FROM public.profiles WHERE role = 'admin' LIMIT 1;
    
    -- Verificar se já existe chave Gemini ativa
    SELECT COUNT(*) INTO gemini_key_count 
    FROM public.api_keys 
    WHERE provider = 'gemini' 
    AND is_active = true 
    AND encrypted_key IS NOT NULL 
    AND encrypted_key != '' 
    AND encrypted_key NOT LIKE '%SUBSTITUA%'
    AND encrypted_key NOT LIKE '%your_%'
    AND LENGTH(encrypted_key) > 30;
    
    IF gemini_key_count = 0 THEN
        -- Inserir/atualizar chave Gemini com a chave do .env
        INSERT INTO public.api_keys (
            provider, 
            key_name, 
            encrypted_key, 
            is_active,
            admin_id,
            created_at,
            updated_at
        ) VALUES (
            'gemini', 
            'GEMINI_API_KEY', 
            'AIzaSyB3oWtxSBybvdz8YYMStIUB1QQGQ_AcqTs', 
            true,
            admin_uuid,
            NOW(),
            NOW()
        )
        ON CONFLICT (provider) 
        DO UPDATE SET 
            encrypted_key = 'AIzaSyB3oWtxSBybvdz8YYMStIUB1QQGQ_AcqTs',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Chave Gemini configurada com sucesso!';
    ELSE
        RAISE NOTICE 'Chave Gemini já está configurada e ativa';
    END IF;
END $$;

-- Verificar status final
SELECT 'Status final das chaves API:' as info;
SELECT 
    provider,
    key_name,
    LEFT(encrypted_key, 15) || '...' as key_preview,
    is_active,
    CASE 
        WHEN encrypted_key LIKE 'AIza%' AND LENGTH(encrypted_key) > 30 
        THEN '✅ FORMATO VÁLIDO'
        WHEN encrypted_key LIKE '%SUBSTITUA%' OR encrypted_key LIKE '%your_%' 
        THEN '❌ PLACEHOLDER'
        ELSE '⚠️ VERIFICAR'
    END as status,
    created_at
FROM public.api_keys 
ORDER BY provider, created_at DESC;
