-- Script para verificar e corrigir as chaves de API
-- Execute este script para garantir que as chaves estão corretas

DO $$
BEGIN
    -- Show current API keys
    RAISE NOTICE '🔍 Current API keys:';
    FOR rec IN SELECT provider, key_name, is_active, substring(key_value, 1, 15) || '...' as key_preview FROM api_keys ORDER BY provider, created_at
    LOOP
        RAISE NOTICE '  - %: % (active: %) - %', rec.provider, rec.key_name, rec.is_active, rec.key_preview;
    END LOOP;

    -- Deactivate all Gemini keys first
    UPDATE api_keys SET is_active = false WHERE provider = 'gemini';
    RAISE NOTICE '✅ Deactivated all Gemini keys';

    -- Activate the specific Gemini key from attachment
    UPDATE api_keys 
    SET is_active = true, updated_at = NOW()
    WHERE provider = 'gemini' 
    AND key_value = 'AIzaSyCGZNjIcGFV7ujBWjuYGuR_a80wnRVdtls';

    -- Check if the key was activated
    IF FOUND THEN
        RAISE NOTICE '✅ Activated Gemini key: AIzaSyCGZNjIcGFV7ujBWjuYGuR_a80wnRVdtls';
    ELSE
        RAISE NOTICE '❌ Gemini key not found, inserting it...';
        
        -- Insert the key if it doesn't exist
        INSERT INTO api_keys (id, provider, key_name, key_value, is_active, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'gemini',
            'Working Gemini Key',
            'AIzaSyCGZNjIcGFV7ujBWjuYGuR_a80wnRVdtls',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Inserted and activated new Gemini key';
    END IF;

    -- Show final state
    RAISE NOTICE '🔍 Final API keys state:';
    FOR rec IN SELECT provider, key_name, is_active, substring(key_value, 1, 15) || '...' as key_preview FROM api_keys ORDER BY provider, created_at
    LOOP
        RAISE NOTICE '  - %: % (active: %) - %', rec.provider, rec.key_name, rec.is_active, rec.key_preview;
    END LOOP;

END $$;

-- 5. Teste de inserção de conversa (para debug)
DO $$
DECLARE
    test_user_id UUID;
    test_conversation_id UUID;
BEGIN
    -- Buscar um usuário existente
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Tentar inserir uma conversa de teste
        INSERT INTO conversations (
            user_id,
            title,
            messages,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            'Teste de API - ' || NOW()::text,
            '[{"role":"user","content":"teste","timestamp":"' || NOW()::text || '"},{"role":"assistant","content":"Amém, irmão!","timestamp":"' || NOW()::text || '"}]'::jsonb,
            NOW(),
            NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ TESTE DE INSERÇÃO SUCCESSFUL! Conversation ID: %', test_conversation_id;
        
        -- Verificar se foi salvo corretamente
        IF EXISTS (SELECT 1 FROM conversations WHERE id = test_conversation_id) THEN
            RAISE NOTICE '✅ VERIFICAÇÃO SUCCESSFUL! Conversa salva corretamente.';
        ELSE
            RAISE NOTICE '❌ VERIFICAÇÃO FAILED! Conversa não encontrada.';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Nenhum usuário encontrado para teste.';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO NO TESTE: %', SQLERRM;
END $$;
