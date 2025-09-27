-- Sistema de Tokens e Assinaturas
-- Criado para gerenciar tokens, planos e pagamentos

-- 1. Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime', 'one_time')),
    tokens_included INTEGER NOT NULL DEFAULT 0, -- 0 = ilimitado
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Tokens do Usuário
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tokens_remaining INTEGER NOT NULL DEFAULT 3,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_plan_id UUID REFERENCES public.subscription_plans(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Tabela de Assinaturas Ativas
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Transações/Pagamentos
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'pix', 'manual')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_intent_id TEXT,
    pix_qr_code TEXT,
    pix_qr_code_expires_at TIMESTAMP WITH TIME ZONE,
    tokens_granted INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Histórico de Uso de Tokens
CREATE TABLE IF NOT EXISTS public.token_usage_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    tokens_used INTEGER NOT NULL DEFAULT 1,
    action_type TEXT NOT NULL CHECK (action_type IN ('chat_message', 'voice_message', 'document_upload')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inserir planos padrão
INSERT INTO public.subscription_plans (name, description, price, billing_cycle, tokens_included, features) VALUES
('Gratuito', 'Plano gratuito com 3 perguntas', 0.00, 'one_time', 3, '["3 perguntas por sessão", "Acesso básico ao chat"]'::jsonb),
('Mensal', 'Plano mensal com tokens ilimitados', 29.90, 'monthly', 0, '["Tokens ilimitados", "Suporte prioritário", "Acesso a todas as funcionalidades"]'::jsonb),
('Anual', 'Plano anual com desconto', 299.00, 'yearly', 0, '["Tokens ilimitados", "Suporte prioritário", "Acesso a todas as funcionalidades", "2 meses grátis"]'::jsonb),
('Vitalício', 'Pagamento único para acesso vitalício', 999.00, 'lifetime', 0, '["Tokens ilimitados para sempre", "Suporte VIP", "Acesso antecipado a novas funcionalidades"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 7. Função para inicializar tokens do usuário
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_tokens (user_id, tokens_remaining, tokens_used)
    VALUES (NEW.id, 3, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para criar tokens automaticamente quando um usuário é criado
DROP TRIGGER IF EXISTS trigger_initialize_user_tokens ON public.profiles;
CREATE TRIGGER trigger_initialize_user_tokens
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_tokens();

-- 9. Função para consumir token
CREATE OR REPLACE FUNCTION consume_user_token(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_tokens INTEGER;
    has_unlimited BOOLEAN := false;
BEGIN
    -- Verificar se o usuário tem assinatura ativa com tokens ilimitados
    SELECT EXISTS(
        SELECT 1 FROM public.user_subscriptions us
        JOIN public.subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = p_user_id 
        AND us.status = 'active'
        AND sp.tokens_included = 0
        AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
    ) INTO has_unlimited;
    
    -- Se tem tokens ilimitados, permitir uso
    IF has_unlimited THEN
        INSERT INTO public.token_usage_history (user_id, tokens_used, action_type)
        VALUES (p_user_id, 1, 'chat_message');
        RETURN true;
    END IF;
    
    -- Verificar tokens disponíveis
    SELECT tokens_remaining INTO current_tokens
    FROM public.user_tokens
    WHERE user_id = p_user_id;
    
    -- Se não tem tokens suficientes
    IF current_tokens IS NULL OR current_tokens <= 0 THEN
        RETURN false;
    END IF;
    
    -- Consumir token
    UPDATE public.user_tokens
    SET tokens_remaining = tokens_remaining - 1,
        tokens_used = tokens_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Registrar uso
    INSERT INTO public.token_usage_history (user_id, tokens_used, action_type)
    VALUES (p_user_id, 1, 'chat_message');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 10. Função para verificar se usuário pode usar o serviço
CREATE OR REPLACE FUNCTION can_user_chat(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_tokens INTEGER;
    has_unlimited BOOLEAN := false;
BEGIN
    -- Verificar se o usuário tem assinatura ativa com tokens ilimitados
    SELECT EXISTS(
        SELECT 1 FROM public.user_subscriptions us
        JOIN public.subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = p_user_id 
        AND us.status = 'active'
        AND sp.tokens_included = 0
        AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
    ) INTO has_unlimited;
    
    IF has_unlimited THEN
        RETURN true;
    END IF;
    
    -- Verificar tokens disponíveis
    SELECT tokens_remaining INTO current_tokens
    FROM public.user_tokens
    WHERE user_id = p_user_id;
    
    RETURN current_tokens IS NOT NULL AND current_tokens > 0;
END;
$$ LANGUAGE plpgsql;

-- 11. Função para adicionar tokens após pagamento
CREATE OR REPLACE FUNCTION add_tokens_after_payment(p_user_id UUID, p_plan_id UUID)
RETURNS VOID AS $$
DECLARE
    plan_tokens INTEGER;
    plan_cycle TEXT;
BEGIN
    -- Buscar informações do plano
    SELECT tokens_included, billing_cycle INTO plan_tokens, plan_cycle
    FROM public.subscription_plans
    WHERE id = p_plan_id;
    
    -- Se é plano com tokens limitados, adicionar tokens
    IF plan_tokens > 0 THEN
        UPDATE public.user_tokens
        SET tokens_remaining = tokens_remaining + plan_tokens,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Se é plano ilimitado, criar/atualizar assinatura
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
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 12. Políticas de segurança (RLS)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage_history ENABLE ROW LEVEL SECURITY;

-- Políticas para subscription_plans (todos podem ver planos ativos)
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Políticas para user_tokens (usuários só veem seus próprios tokens)
CREATE POLICY "Users can view own tokens" ON public.user_tokens
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own tokens" ON public.user_tokens
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tokens" ON public.user_tokens
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Políticas similares para outras tabelas
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own transactions" ON public.payment_transactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own usage history" ON public.token_usage_history
FOR SELECT USING (user_id = auth.uid());

-- Políticas de admin para todas as tabelas
CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can manage transactions" ON public.payment_transactions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can view usage history" ON public.token_usage_history
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 13. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_token_usage_history_user_id ON public.token_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_history_created_at ON public.token_usage_history(created_at);