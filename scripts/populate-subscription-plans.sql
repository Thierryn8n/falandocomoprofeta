-- Script para popular a tabela subscription_plans com dados iniciais
-- Execute apenas se a tabela estiver vazia

-- Primeiro, verificar se já existem dados
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM public.subscription_plans;
    
    IF record_count = 0 THEN
        -- Inserir planos básicos se a tabela estiver vazia
        INSERT INTO public.subscription_plans (
            plan_type, 
            price, 
            currency, 
            features, 
            is_active, 
            tokens_included,
            card_color,
            card_title,
            card_description
        ) VALUES 
        (
            'basic', 
            9.90, 
            'BRL', 
            '["Chat básico", "Suporte por email", "100 mensagens/mês"]'::jsonb, 
            true, 
            100,
            '#3b82f6',
            'Plano Básico',
            'Ideal para uso pessoal'
        ),
        (
            'premium', 
            29.90, 
            'BRL', 
            '["Chat ilimitado", "Suporte prioritário", "Mensagens ilimitadas", "Recursos avançados"]'::jsonb, 
            true, 
            1000,
            '#10b981',
            'Plano Premium',
            'Para usuários avançados'
        ),
        (
            'enterprise', 
            99.90, 
            'BRL', 
            '["Tudo do Premium", "Suporte 24/7", "API personalizada", "Integração empresarial"]'::jsonb, 
            true, 
            10000,
            '#f59e0b',
            'Plano Enterprise',
            'Para empresas e organizações'
        );
        
        RAISE NOTICE 'Planos de assinatura inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'A tabela já contém % registros. Não inserindo dados duplicados.', record_count;
    END IF;
END $$;