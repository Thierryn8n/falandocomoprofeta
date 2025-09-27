-- Sistema Simplificado de Assinaturas
-- Apenas planos mensal e anual + contador de perguntas

-- 1. Criar tabela user_subscriptions se não existir
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Criar tabela para contabilizar perguntas dos usuários
CREATE TABLE IF NOT EXISTS public.user_question_count (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions_today INTEGER NOT NULL DEFAULT 0,
  last_question_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Limpar planos existentes e criar apenas mensal e anual
DELETE FROM public.subscription_plans;

INSERT INTO public.subscription_plans (id, plan_type, price, currency, features, is_active) VALUES
(gen_random_uuid(), 'monthly', 19.90, 'BRL', '["Acesso ilimitado por 1 mês"]', true),
(gen_random_uuid(), 'yearly', 199.00, 'BRL', '["Acesso ilimitado por 1 ano", "2 meses grátis"]', true);

-- 4. Função para verificar se usuário tem assinatura ativa
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

-- 5. Função para incrementar contador de perguntas
CREATE OR REPLACE FUNCTION increment_question_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Inserir ou atualizar contador de perguntas
    INSERT INTO public.user_question_count (user_id, total_questions, questions_today, last_question_date)
    VALUES (p_user_id, 1, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        total_questions = user_question_count.total_questions + 1,
        questions_today = CASE 
            WHEN user_question_count.last_question_date = CURRENT_DATE 
            THEN user_question_count.questions_today + 1
            ELSE 1
        END,
        last_question_date = CURRENT_DATE,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Função para obter contador de perguntas do usuário
CREATE OR REPLACE FUNCTION get_user_question_count(p_user_id UUID)
RETURNS TABLE (
    total_questions INTEGER,
    questions_today INTEGER,
    last_question_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(uqc.total_questions, 0) as total_questions,
        CASE 
            WHEN uqc.last_question_date = CURRENT_DATE 
            THEN COALESCE(uqc.questions_today, 0)
            ELSE 0
        END as questions_today,
        uqc.last_question_date
    FROM public.user_question_count uqc
    WHERE uqc.user_id = p_user_id
    UNION ALL
    SELECT 0, 0, NULL
    WHERE NOT EXISTS (SELECT 1 FROM public.user_question_count WHERE user_id = p_user_id)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para ativar assinatura do usuário
CREATE OR REPLACE FUNCTION activate_user_subscription(p_user_id UUID, p_plan_id UUID)
RETURNS VOID AS $$
DECLARE
    plan_cycle TEXT;
    plan_active BOOLEAN;
BEGIN
    -- Buscar informações do plano
    SELECT plan_type, is_active INTO plan_cycle, plan_active
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
            ELSE NULL
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

-- 8. Função para obter informações da assinatura do usuário
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
        sp.plan_type,
        CASE 
            WHEN sp.plan_type = 'monthly' THEN 'Plano Mensal'
            WHEN sp.plan_type = 'yearly' THEN 'Plano Anual'
            ELSE sp.plan_type
        END as plan_description,
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

-- 9. Habilitar RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_count ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas RLS
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own question count" ON public.user_question_count;
CREATE POLICY "Users can view own question count" ON public.user_question_count
    FOR ALL USING (auth.uid() = user_id);

-- 11. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_question_count_user_id ON public.user_question_count(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_count_date ON public.user_question_count(last_question_date);