-- =====================================================
-- SISTEMA DE LIMITAÇÃO DE PERGUNTAS (50 perguntas/dia)
-- =====================================================
-- Criado em: 2026-01-14
-- Função: Controlar limite de 50 perguntas por dia para usuários não-admin
-- Reset automático à meia-noite

-- Tabela de limites diários de perguntas
CREATE TABLE IF NOT EXISTS public.user_question_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_count INTEGER NOT NULL DEFAULT 0,
    max_questions INTEGER NOT NULL DEFAULT 50,
    limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint única: um registro por usuário por dia
    CONSTRAINT unique_user_daily_limit UNIQUE (user_id, limit_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_question_limits_user_id 
    ON public.user_question_limits(user_id);
    
CREATE INDEX IF NOT EXISTS idx_user_question_limits_date 
    ON public.user_question_limits(limit_date);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_question_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_limits_updated_at 
    ON public.user_question_limits;
    
CREATE TRIGGER trigger_update_question_limits_updated_at
    BEFORE UPDATE ON public.user_question_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_question_limits_updated_at();

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.user_question_limits ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios limites
CREATE POLICY "Users can view own question limits"
    ON public.user_question_limits
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política: Usuários podem inserir apenas seus próprios limites  
CREATE POLICY "Users can insert own question limits"
    ON public.user_question_limits
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios limites
CREATE POLICY "Users can update own question limits"
    ON public.user_question_limits
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem ver todos os limites
CREATE POLICY "Admins can view all question limits"
    ON public.user_question_limits
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Remover funções existentes para evitar conflito de tipos
DROP FUNCTION IF EXISTS public.can_user_ask_question(UUID);
DROP FUNCTION IF EXISTS public.increment_question_count(UUID);
DROP FUNCTION IF EXISTS public.get_user_question_count(UUID);
DROP FUNCTION IF EXISTS public.reset_daily_question_limits();

-- Função: Verificar se usuário pode fazer pergunta
CREATE OR REPLACE FUNCTION public.can_user_ask_question(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_current_count INTEGER;
    v_max_allowed INTEGER := 50;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Admins não têm limite
    IF v_is_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Buscar contador atual do dia
    SELECT question_count INTO v_current_count
    FROM public.user_question_limits
    WHERE user_id = p_user_id 
      AND limit_date = CURRENT_DATE;
    
    -- Se não existe registro, pode perguntar (count = 0)
    IF v_current_count IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se ainda tem perguntas disponíveis
    RETURN v_current_count < v_max_allowed;
END;
$$;

-- Função: Incrementar contador de perguntas
CREATE OR REPLACE FUNCTION public.increment_question_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_new_count INTEGER;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Admins não incrementam contador
    IF v_is_admin THEN
        RETURN -1; -- Indica admin (sem limite)
    END IF;
    
    -- Inserir ou atualizar contador
    INSERT INTO public.user_question_limits (user_id, question_count, limit_date)
    VALUES (p_user_id, 1, CURRENT_DATE)
    ON CONFLICT (user_id, limit_date) 
    DO UPDATE SET 
        question_count = user_question_limits.question_count + 1
    RETURNING question_count INTO v_new_count;
    
    RETURN v_new_count;
END;
$$;

-- Função: Obter contador atual do usuário
CREATE OR REPLACE FUNCTION public.get_user_question_count(p_user_id UUID)
RETURNS TABLE (
    current_count INTEGER,
    max_allowed INTEGER,
    remaining INTEGER,
    can_ask BOOLEAN,
    is_admin BOOLEAN,
    reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_current INTEGER := 0;
    v_max INTEGER := 50;
    v_remaining INTEGER;
    v_can_ask BOOLEAN;
    v_reset_at TIMESTAMPTZ;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Calcular próximo reset (meia-noite)
    v_reset_at := DATE_TRUNC('day', CURRENT_DATE + INTERVAL '1 day');
    
    IF v_is_admin THEN
        -- Admins: sem limites
        RETURN QUERY SELECT 
            0::INTEGER, 
            -1::INTEGER, -- -1 indica ilimitado
            -1::INTEGER,
            TRUE,
            TRUE,
            v_reset_at;
        RETURN;
    END IF;
    
    -- Buscar contador atual
    SELECT question_count INTO v_current
    FROM public.user_question_limits
    WHERE user_id = p_user_id 
      AND limit_date = CURRENT_DATE;
    
    -- Se não existe, contador é 0
    IF v_current IS NULL THEN
        v_current := 0;
    END IF;
    
    v_remaining := GREATEST(0, v_max - v_current);
    v_can_ask := v_current < v_max;
    
    RETURN QUERY SELECT 
        v_current,
        v_max,
        v_remaining,
        v_can_ask,
        v_is_admin,
        v_reset_at;
END;
$$;

-- Função: Reset automático de limites (pode ser chamada por cron job)
CREATE OR REPLACE FUNCTION public.reset_daily_question_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Não precisa fazer nada pois o limit_date garante isolamento por dia
    -- Mas podemos limpar registros antigos para economizar espaço
    DELETE FROM public.user_question_limits
    WHERE limit_date < CURRENT_DATE - INTERVAL '30 days';
END;
$$;

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Garantir que funções são acessíveis
GRANT EXECUTE ON FUNCTION public.can_user_ask_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_question_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_question_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_daily_question_limits() TO service_role;

-- Comentários para documentação
COMMENT ON TABLE public.user_question_limits IS 'Armazena limite diário de perguntas por usuário (máximo 50/dia)';
COMMENT ON FUNCTION public.can_user_ask_question(UUID) IS 'Verifica se usuário pode fazer pergunta (retorna TRUE se count < 50 ou se for admin)';
COMMENT ON FUNCTION public.increment_question_count(UUID) IS 'Incrementa contador de perguntas do usuário (ignora admins)';
COMMENT ON FUNCTION public.get_user_question_count(UUID) IS 'Retorna estatísticas de uso de perguntas do usuário';

-- Verificação de criação
SELECT 'Tabela user_question_limits criada com sucesso!' AS status;
