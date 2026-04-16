-- =====================================================
-- SISTEMA DE PERGUNTAS: 50 INICIAIS + 1 POR DIA APÓS
-- =====================================================
-- Lógica: Usuários têm 50 perguntas de bônus iniciais.
-- Depois de usarem as 50, passam a ter 1 pergunta por dia.
-- =====================================================

-- 1. Adicionar coluna para rastrear total de perguntas (lifetime)
ALTER TABLE public.user_question_limits 
ADD COLUMN IF NOT EXISTS total_lifetime_count INTEGER NOT NULL DEFAULT 0;

-- 2. Atualizar comentário da tabela
COMMENT ON TABLE public.user_question_limits IS 
'Armazena limite de perguntas: 50 iniciais (bônus) + 1 por dia após zerar o bônus';

-- =====================================================
-- FUNÇÃO: Verificar se usuário pode fazer pergunta (ATUALIZADA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_user_ask_question(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_daily_count INTEGER;
    v_lifetime_count INTEGER;
    v_bonus_used BOOLEAN;
    v_max_daily INTEGER;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Admins não têm limite
    IF v_is_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Buscar contador do dia e lifetime
    SELECT 
        question_count, 
        total_lifetime_count 
    INTO v_daily_count, v_lifetime_count
    FROM public.user_question_limits
    WHERE user_id = p_user_id 
      AND limit_date = CURRENT_DATE;
    
    -- Se não existe registro hoje, contador é 0
    IF v_daily_count IS NULL THEN
        v_daily_count := 0;
    END IF;
    
    -- Verificar se já usou as 50 perguntas de bônus
    v_bonus_used := COALESCE(v_lifetime_count, 0) >= 50;
    
    -- Definir limite diário baseado no bônus
    IF v_bonus_used THEN
        -- Já usou as 50: só pode 1 por dia
        v_max_daily := 1;
    ELSE
        -- Ainda nas 50 iniciais: pode até 50 (ou até acabar o bônus)
        v_max_daily := 50;
    END IF;
    
    -- Verificar se ainda tem perguntas disponíveis hoje
    RETURN v_daily_count < v_max_daily;
END;
$$;

-- =====================================================
-- FUNÇÃO: Incrementar contador de perguntas (ATUALIZADA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.increment_question_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_new_daily_count INTEGER;
    v_new_lifetime_count INTEGER;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Admins não incrementam contador
    IF v_is_admin THEN
        RETURN -1;
    END IF;
    
    -- Inserir ou atualizar contador
    INSERT INTO public.user_question_limits (
        user_id, 
        question_count, 
        total_lifetime_count,
        limit_date
    )
    VALUES (
        p_user_id, 
        1, 
        1,
        CURRENT_DATE
    )
    ON CONFLICT (user_id, limit_date) 
    DO UPDATE SET 
        question_count = user_question_limits.question_count + 1,
        total_lifetime_count = user_question_limits.total_lifetime_count + 1
    RETURNING 
        question_count, 
        total_lifetime_count 
    INTO v_new_daily_count, v_new_lifetime_count;
    
    RETURN v_new_daily_count;
END;
$$;

-- =====================================================
-- FUNÇÃO: Obter contador atual do usuário (ATUALIZADA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_question_count(p_user_id UUID)
RETURNS TABLE (
    current_count INTEGER,
    max_allowed INTEGER,
    remaining INTEGER,
    can_ask BOOLEAN,
    is_admin BOOLEAN,
    reset_at TIMESTAMPTZ,
    lifetime_count INTEGER,
    bonus_remaining INTEGER,
    is_bonus_period BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_daily_count INTEGER := 0;
    v_lifetime_count INTEGER := 0;
    v_max INTEGER;
    v_remaining INTEGER;
    v_can_ask BOOLEAN;
    v_reset_at TIMESTAMPTZ;
    v_bonus_remaining INTEGER;
    v_is_bonus BOOLEAN;
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
            -1::INTEGER,
            -1::INTEGER,
            TRUE,
            TRUE,
            v_reset_at,
            0::INTEGER,
            -1::INTEGER,
            FALSE;
        RETURN;
    END IF;
    
    -- Buscar contador do dia e lifetime
    SELECT 
        question_count,
        total_lifetime_count
    INTO v_daily_count, v_lifetime_count
    FROM public.user_question_limits
    WHERE user_id = p_user_id 
      AND limit_date = CURRENT_DATE;
    
    -- Se não existe registro hoje, contador é 0
    IF v_daily_count IS NULL THEN
        v_daily_count := 0;
    END IF;
    IF v_lifetime_count IS NULL THEN
        v_lifetime_count := 0;
    END IF;
    
    -- Calcular perguntas de bônus restantes
    v_bonus_remaining := GREATEST(0, 50 - v_lifetime_count);
    
    -- Verificar se ainda está no período de bônus
    v_is_bonus := v_lifetime_count < 50;
    
    -- Definir limite baseado no período
    IF v_is_bonus THEN
        -- Período de bônus: pode usar até 50 (ou até acabar)
        v_max := 50;
    ELSE
        -- Após bônus: 1 por dia
        v_max := 1;
    END IF;
    
    v_remaining := GREATEST(0, v_max - v_daily_count);
    v_can_ask := v_daily_count < v_max;
    
    RETURN QUERY SELECT 
        v_daily_count,
        v_max,
        v_remaining,
        v_can_ask,
        v_is_admin,
        v_reset_at,
        v_lifetime_count,
        v_bonus_remaining,
        v_is_bonus;
END;
$$;

-- =====================================================
-- PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION public.can_user_ask_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_question_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_question_count(UUID) TO authenticated;

-- Comentários atualizados
COMMENT ON FUNCTION public.can_user_ask_question(UUID) IS 
'Verifica se usuário pode fazer pergunta: até 50 iniciais (bônus), depois 1 por dia';

COMMENT ON FUNCTION public.increment_question_count(UUID) IS 
'Incrementa contador diário e lifetime. Ignora admins.';

COMMENT ON FUNCTION public.get_user_question_count(UUID) IS 
'Retorna estatísticas: perguntas hoje, limite, bônus restantes, etc.';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Sistema de perguntas atualizado!' as status,
       '50 perguntas de bônus + 1 por dia após zerar o bônus' as descricao;
