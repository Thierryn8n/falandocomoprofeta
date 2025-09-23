-- Script para corrigir configuração da chave Gemini API
-- Execute este script para atualizar a chave da API do Gemini

-- Primeiro, verificar o status atual
SELECT 'Status atual das chaves API:' as info;
SELECT 
    id,
    provider,
    key_name,
    LEFT(key_value, 15) || '...' as key_preview,
    is_active,
    created_at
FROM public.api_keys 
WHERE provider = 'gemini'
ORDER BY created_at DESC;

-- Verificar se existe usuário admin
SELECT 'Usuários admin:' as info;
SELECT id, email, role FROM public.profiles WHERE role = 'admin';

-- Atualizar ou inserir chave Gemini correta
DO $$
DECLARE
    admin_uuid UUID;
    existing_key_count INTEGER;
    gemini_key_id UUID;
BEGIN
    -- Obter o ID do admin
    SELECT id INTO admin_uuid FROM public.profiles WHERE role = 'admin' LIMIT 1;
    
    IF admin_uuid IS NULL THEN
        RAISE NOTICE 'AVISO: Nenhum usuário admin encontrado. Criando entrada sem admin_id.';
    END IF;
    
    -- Verificar se já existe uma chave Gemini
    SELECT COUNT(*) INTO existing_key_count FROM public.api_keys WHERE provider = 'gemini';
    
    IF existing_key_count = 0 THEN
        -- Inserir nova chave Gemini
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
            'SUBSTITUA_PELA_SUA_CHAVE_GEMINI_REAL_AQUI', 
            false,  -- Inativa até ser configurada corretamente
            admin_uuid,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Nova chave Gemini inserida. IMPORTANTE: Substitua o valor pela sua chave real!';
    ELSE
        -- Atualizar chave existente se ainda for placeholder
        UPDATE public.api_keys 
        SET 
            key_value = CASE 
                WHEN key_value LIKE '%your_gemini_api_key_here%' 
                  OR key_value LIKE '%SUA_CHAVE_GEMINI_AQUI%'
                  OR key_value LIKE '%SUBSTITUA_PELA_SUA_CHAVE%'
                  OR LENGTH(key_value) < 30
                THEN 'SUBSTITUA_PELA_SUA_CHAVE_GEMINI_REAL_AQUI'
                ELSE key_value
            END,
            is_active = CASE 
                WHEN key_value LIKE '%your_gemini_api_key_here%' 
                  OR key_value LIKE '%SUA_CHAVE_GEMINI_AQUI%'
                  OR key_value LIKE '%SUBSTITUA_PELA_SUA_CHAVE%'
                  OR LENGTH(key_value) < 30
                THEN false  -- Desativar se for placeholder
                ELSE is_active
            END,
            admin_id = COALESCE(admin_id, admin_uuid),
            updated_at = NOW()
        WHERE provider = 'gemini';
        
        RAISE NOTICE 'Chave Gemini existente atualizada.';
    END IF;
END $$;

-- Mostrar instruções para o usuário
SELECT 'INSTRUÇÕES IMPORTANTES:' as info;
SELECT '
🔑 CONFIGURAÇÃO DA CHAVE GEMINI API

1. OBTER A CHAVE:
   - Acesse: https://aistudio.google.com/app/apikey
   - Faça login com sua conta Google
   - Clique em "Create API Key"
   - Copie a chave gerada (deve começar com "AIza")

2. CONFIGURAR NO VERCEL (Recomendado):
   - Acesse: https://vercel.com/dashboard
   - Selecione seu projeto
   - Vá em Settings → Environment Variables
   - Adicione: GEMINI_API_KEY = sua_chave_aqui

3. OU CONFIGURAR NO BANCO DE DADOS:
   - Execute: UPDATE public.api_keys 
             SET key_value = ''SUA_CHAVE_AQUI'', is_active = true 
             WHERE provider = ''gemini'';

4. VERIFICAR:
   - Teste o chat na aplicação
   - Verifique os logs no console
   - A chave deve ter ~39 caracteres e começar com "AIza"

⚠️  IMPORTANTE: Substitua os placeholders pelas chaves reais!
' as instrucoes;

-- Status final
SELECT 'Status final:' as info;
SELECT 
    provider,
    key_name,
    CASE 
        WHEN key_value LIKE '%SUBSTITUA%' OR key_value LIKE '%your_%' OR key_value LIKE '%SUA_%' 
        THEN '❌ PLACEHOLDER - PRECISA SER CONFIGURADA'
        WHEN LENGTH(key_value) < 30 
        THEN '❌ MUITO CURTA - VERIFIQUE A CHAVE'
        WHEN key_value LIKE 'AIza%' 
        THEN '✅ FORMATO CORRETO'
        ELSE '⚠️  FORMATO SUSPEITO'
    END as status,
    is_active,
    updated_at
FROM public.api_keys 
WHERE provider = 'gemini';
