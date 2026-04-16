-- =====================================================
-- SISTEMA DE DOAÇÕES - PACOTES DE PERGUNTAS
-- =====================================================
-- Criado em: 2026-01-14
-- Função: Permitir doações únicas que adicionam perguntas extras
-- Integração: Mercado Pago (PIX e Cartão)

-- =====================================================
-- TABELA: PACOTES DE DOAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.donation_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    questions_added INTEGER NOT NULL,
    mercado_pago_product_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    card_color VARCHAR(20) DEFAULT 'emerald',
    icon VARCHAR(50) DEFAULT 'gift',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_donation_packages_order 
    ON public.donation_packages(display_order);

CREATE INDEX IF NOT EXISTS idx_donation_packages_active 
    ON public.donation_packages(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_donation_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_donation_packages_updated_at 
    ON public.donation_packages;
    
CREATE TRIGGER trigger_update_donation_packages_updated_at
    BEFORE UPDATE ON public.donation_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_donation_packages_updated_at();

-- =====================================================
-- TABELA: DOAÇÕES (TRANSAÇÕES)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.donation_packages(id),
    
    -- Dados do pagamento
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'pix', 'credit_card', 'debit_card'
    payment_system VARCHAR(50) NOT NULL DEFAULT 'mercado_pago', -- 'mercado_pago', 'abacate_pay'
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    
    -- IDs externos
    mercado_pago_payment_id VARCHAR(255),
    mercado_pago_preference_id VARCHAR(255),
    mercado_pago_external_reference VARCHAR(255),
    
    -- Perguntas adicionadas
    questions_added INTEGER NOT NULL,
    questions_used INTEGER NOT NULL DEFAULT 0,
    
    -- Dados do pagador
    payer_email VARCHAR(255),
    payer_name VARCHAR(255),
    payer_document VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_donations_user_id 
    ON public.user_donations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_donations_status 
    ON public.user_donations(status);

CREATE INDEX IF NOT EXISTS idx_user_donations_mp_payment_id 
    ON public.user_donations(mercado_pago_payment_id) 
    WHERE mercado_pago_payment_id IS NOT NULL;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_user_donations_updated_at 
    ON public.user_donations;
    
CREATE TRIGGER trigger_update_user_donations_updated_at
    BEFORE UPDATE ON public.user_donations
    FOR EACH ROW
    EXECUTE FUNCTION update_donation_packages_updated_at();

-- =====================================================
-- TABELA: PERGUNTAS BONUS (CRÉDITOS)
-- =====================================================
-- Armazena perguntas extras adquiridas via doação
CREATE TABLE IF NOT EXISTS public.user_bonus_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    donation_id UUID NOT NULL REFERENCES public.user_donations(id) ON DELETE CASCADE,
    
    -- Quantidade
    total_questions INTEGER NOT NULL,
    used_questions INTEGER NOT NULL DEFAULT 0,
    remaining_questions INTEGER GENERATED ALWAYS AS (total_questions - used_questions) STORED,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ, -- NULL = não expira
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_bonus_questions_user_id 
    ON public.user_bonus_questions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_bonus_questions_active 
    ON public.user_bonus_questions(user_id, is_active) 
    WHERE is_active = true;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_user_bonus_questions_updated_at 
    ON public.user_bonus_questions;
    
CREATE TRIGGER trigger_update_user_bonus_questions_updated_at
    BEFORE UPDATE ON public.user_bonus_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_donation_packages_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- donation_packages: visível para todos
ALTER TABLE public.donation_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active donation packages"
    ON public.donation_packages
    FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

-- user_donations: usuário vê apenas suas doações
ALTER TABLE public.user_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own donations"
    ON public.user_donations
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own donations"
    ON public.user_donations
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- user_bonus_questions: usuário vê apenas seus créditos
ALTER TABLE public.user_bonus_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bonus questions"
    ON public.user_bonus_questions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função: Verificar total de perguntas disponíveis (grátis + bonus)
CREATE OR REPLACE FUNCTION public.get_user_total_available_questions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_daily_remaining INTEGER;
    v_bonus_total INTEGER;
    v_is_admin BOOLEAN;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF v_is_admin THEN
        RETURN -1; -- Ilimitado
    END IF;

    -- Perguntas diárias restantes
    SELECT GREATEST(0, 50 - question_count) INTO v_daily_remaining
    FROM public.user_question_limits
    WHERE user_id = p_user_id AND limit_date = CURRENT_DATE;
    
    IF v_daily_remaining IS NULL THEN
        v_daily_remaining := 50;
    END IF;
    
    -- Perguntas bonus disponíveis
    SELECT COALESCE(SUM(remaining_questions), 0) INTO v_bonus_total
    FROM public.user_bonus_questions
    WHERE user_id = p_user_id 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_daily_remaining + v_bonus_total;
END;
$$;

-- Função: Usar uma pergunta bonus
CREATE OR REPLACE FUNCTION public.use_bonus_question(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bonus_record RECORD;
    v_updated BOOLEAN := false;
BEGIN
    -- Encontrar crédito ativo com perguntas disponíveis
    SELECT id INTO v_bonus_record
    FROM public.user_bonus_questions
    WHERE user_id = p_user_id 
      AND is_active = true
      AND remaining_questions > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF v_bonus_record IS NULL THEN
        RETURN false; -- Não tem créditos
    END IF;
    
    -- Incrementar usadas
    UPDATE public.user_bonus_questions
    SET 
        used_questions = used_questions + 1,
        last_used_at = NOW(),
        is_active = CASE 
            WHEN (total_questions - (used_questions + 1)) <= 0 THEN false 
            ELSE true 
        END
    WHERE id = v_bonus_record.id;
    
    RETURN true;
END;
$$;

-- Função: Processar doação completada (adicionar créditos)
CREATE OR REPLACE FUNCTION public.process_completed_donation(p_donation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_donation RECORD;
BEGIN
    -- Buscar doação
    SELECT * INTO v_donation
    FROM public.user_donations
    WHERE id = p_donation_id AND status = 'completed';
    
    IF v_donation IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar se já processou
    IF EXISTS (
        SELECT 1 FROM public.user_bonus_questions 
        WHERE donation_id = p_donation_id
    ) THEN
        RETURN true; -- Já processado
    END IF;
    
    -- Criar créditos bonus
    INSERT INTO public.user_bonus_questions (
        user_id,
        donation_id,
        total_questions,
        expires_at
    ) VALUES (
        v_donation.user_id,
        v_donation.id,
        v_donation.questions_added,
        NULL -- Não expira
    );
    
    RETURN true;
END;
$$;

-- Função: Criar nova doação
CREATE OR REPLACE FUNCTION public.create_donation(
    p_user_id UUID,
    p_package_id UUID,
    p_payment_method VARCHAR,
    p_payment_system VARCHAR DEFAULT 'mercado_pago'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_package RECORD;
    v_donation_id UUID;
BEGIN
    -- Buscar pacote
    SELECT * INTO v_package
    FROM public.donation_packages
    WHERE id = p_package_id AND is_active = true;
    
    IF v_package IS NULL THEN
        RAISE EXCEPTION 'Package not found or inactive';
    END IF;
    
    -- Criar doação
    INSERT INTO public.user_donations (
        user_id,
        package_id,
        amount,
        payment_method,
        payment_system,
        status,
        questions_added
    ) VALUES (
        p_user_id,
        p_package_id,
        v_package.price,
        p_payment_method,
        p_payment_system,
        'pending',
        v_package.questions_added
    )
    RETURNING id INTO v_donation_id;
    
    RETURN v_donation_id;
END;
$$;

-- =====================================================
-- DADOS INICIAIS (PACOTES PADRÃO)
-- =====================================================

INSERT INTO public.donation_packages (name, description, price, questions_added, display_order, card_color, icon)
VALUES 
    ('Pacote Bronze', 'Adicione 30 perguntas extras', 5.00, 30, 1, 'amber', 'message-circle'),
    ('Pacote Prata', 'Adicione 70 perguntas extras', 10.00, 70, 2, 'slate', 'message-square'),
    ('Pacote Ouro', 'Adicione 150 perguntas extras', 20.00, 150, 3, 'yellow', 'sparkles'),
    ('Pacote Diamante', 'Adicione 400 perguntas extras + Prioridade', 50.00, 400, 4, 'emerald', 'crown')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_user_total_available_questions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_bonus_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_donation(UUID, UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_completed_donation(UUID) TO service_role;

-- Comentários
COMMENT ON TABLE public.donation_packages IS 'Pacotes de doação disponíveis (ex: R$5 = 30 perguntas)';
COMMENT ON TABLE public.user_donations IS 'Registro de doações dos usuários';
COMMENT ON TABLE public.user_bonus_questions IS 'Créditos de perguntas extras adquiridos via doação';

-- Verificação
SELECT 'Sistema de doações criado com sucesso!' AS status;
