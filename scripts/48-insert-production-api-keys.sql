-- Script para inserir chaves de API para produção
-- Execute este script para garantir que as chaves estejam no banco de dados

-- Verificar se a tabela api_keys existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        RAISE EXCEPTION 'Tabela api_keys não existe. Execute primeiro o script de criação de tabelas.';
    END IF;
END $$;

-- Inserir ou atualizar chave do Gemini
INSERT INTO public.api_keys (provider, key_name, key_value, is_active, created_at, updated_at)
VALUES (
    'gemini',
    'GEMINI_API_KEY',
    'SUA_CHAVE_GEMINI_AQUI',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (provider, key_name) DO UPDATE SET
    key_value = EXCLUDED.key_value,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Inserir ou atualizar chave do XAI (se necessário)
INSERT INTO public.api_keys (provider, key_name, key_value, is_active, created_at, updated_at)
VALUES (
    'xai',
    'XAI_API_KEY',
    'sua_chave_xai_aqui',
    false,
    NOW(),
    NOW()
)
ON CONFLICT (provider, key_name) DO UPDATE SET
    key_value = EXCLUDED.key_value,
    updated_at = NOW();

-- Verificar as chaves inseridas
SELECT provider, key_name, is_active, created_at FROM public.api_keys ORDER BY created_at DESC;
