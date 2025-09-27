-- Atualização do Sistema de Assinaturas
-- Remove lógica de tokens e foca apenas em assinaturas ativas

-- 1. Atualizar função can_user_chat para verificar apenas assinatura ativa
CREATE OR REPLACE FUNCTION can_user_chat(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_active_subscription BOOLEAN := false;
BEGIN
    -- Verificar se o usuário tem assinatura ativa
    SELECT EXISTS(
        SELECT 1 FROM public.user_subscriptions us
        JOIN public.subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = p_user_id 
        AND us.status = 'active'
        AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
        AND sp.is_active = true
    ) INTO has_active_subscription;
    
    RETURN has_active_subscription;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar nova função simplificada para registrar uso (sem consumir tokens)
CREATE OR REPLACE FUNCTION log_chat_usage(p_user_id UUID, p_conversation_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Apenas registrar o uso para estatísticas, sem consumir tokens
    INSERT INTO public.token_usage_history (user_id, conversation_id, tokens_used, action_type)
    VALUES (p_user_id, p_conversation_id, 1, 'chat_message');
END;
$$ LANGUAGE plpgsql;

-- 3. Função para verificar se usuário tem acesso (alias para can_user_chat)
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN can_user_chat(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar função add_tokens_after_payment para focar apenas em assinaturas
CREATE OR REPLACE FUNCTION activate_user_subscription(p_user_id UUID, p_plan_id UUID)
RETURNS VOID AS $$
DECLARE
    plan_cycle TEXT;
    plan_active BOOLEAN;
BEGIN
    -- Buscar informações do plano
    SELECT billing_cycle, is_active INTO plan_cycle, plan_active
    FROM public.subscription_plans
    WHERE id = p_plan_id;
    
    -- Verificar se o plano está ativo
    IF NOT plan_active THEN
        RAISE EXCEPTION 'Plano não está ativo';
    END IF;
    
    -- Criar/atualizar assinatura ativa
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    VALUES (
        p_user_id, 
        p_plan_id, 
        'active',
        NOW(),
        CASE 
            WHEN plan_cycle = 'monthly' THEN NOW() + INTERVAL '1 month'
            WHEN plan_cycle = 'yearly' THEN NOW() + INTERVAL '1 year'
            ELSE NULL -- lifetime
        END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = 'active',
        current_period_start = NOW(),
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Função para desativar assinatura
CREATE OR REPLACE FUNCTION deactivate_user_subscription(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_subscriptions
    SET status = 'canceled',
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para obter informações da assinatura do usuário
CREATE OR REPLACE FUNCTION get_user_subscription_info(p_user_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_description TEXT,
    status TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        sp.name,
        sp.description,
        us.status,
        us.current_period_start,
        us.current_period_end,
        (us.status = 'active' AND (us.current_period_end IS NULL OR us.current_period_end > NOW())) as is_active
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Atualizar planos para remover tokens_included (definir como 0 = ilimitado)
-- NOTA: Esta atualização deve ser feita apenas se a tabela subscription_plans já existir
-- UPDATE public.subscription_plans 
-- SET tokens_included = 0,
--     updated_at = NOW()
-- WHERE tokens_included > 0;

-- 8. Comentário sobre funções obsoletas
-- NOTA: As seguintes funções estão obsoletas no novo sistema:
-- - consume_user_token() - não é mais necessária
-- - add_tokens_after_payment() - substituída por activate_user_subscription()
-- 
-- Elas podem ser removidas em uma migração futura após confirmação
-- de que não estão sendo usadas em nenhum lugar do código.