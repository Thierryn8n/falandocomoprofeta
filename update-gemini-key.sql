-- Script para atualizar a chave da API do Google Gemini
-- Nova chave fornecida pelo usuário: AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc

DO $$
BEGIN
    -- Desativar todas as chaves Gemini existentes
    UPDATE api_keys SET is_active = false WHERE provider = 'gemini';
    RAISE NOTICE '✅ Desativadas todas as chaves Gemini existentes';

    -- Verificar se a nova chave já existe
    IF EXISTS (SELECT 1 FROM api_keys WHERE provider = 'gemini' AND key_value = 'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc') THEN
        -- Ativar a chave existente
        UPDATE api_keys 
        SET is_active = true, updated_at = NOW()
        WHERE provider = 'gemini' 
        AND key_value = 'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc';
        
        RAISE NOTICE '✅ Chave Gemini existente ativada: AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc';
    ELSE
        -- Inserir nova chave
        INSERT INTO api_keys (
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
            'Google Gemini API Key - Paga',
            'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Nova chave Gemini inserida e ativada: AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc';
    END IF;

    -- Mostrar status final
    RAISE NOTICE '🔍 Status final das chaves Gemini:';
    FOR rec IN 
        SELECT 
            key_name,
            LEFT(key_value, 15) || '...' as key_preview,
            is_active,
            created_at
        FROM api_keys 
        WHERE provider = 'gemini'
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE '  - %: % (ativo: %) - criada em %', rec.key_name, rec.key_preview, rec.is_active, rec.created_at;
    END LOOP;

END $$;

-- Verificação final
SELECT 
    'Chaves Gemini configuradas:' as info,
    COUNT(*) as total_keys,
    COUNT(*) FILTER (WHERE is_active = true) as active_keys
FROM api_keys 
WHERE provider = 'gemini';

SELECT 
    key_name,
    LEFT(key_value, 20) || '...' as key_preview,
    is_active,
    created_at
FROM api_keys 
WHERE provider = 'gemini'
ORDER BY created_at DESC;