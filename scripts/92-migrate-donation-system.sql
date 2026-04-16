-- =====================================================
-- MIGRAÇÃO: Alinhar sistema de doações com schema atual
-- Execute APÓS o SQL do usuário já ter sido inserido
-- =====================================================

-- 1. Renomear colunas para compatibilidade (se necessário)
-- Apenas se as colunas tiverem nomes diferentes
DO $$
BEGIN
    -- Verificar se precisa renomear package_id -> donation_package_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_donations'
        AND column_name = 'package_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_donations'
        AND column_name = 'donation_package_id'
    ) THEN
        ALTER TABLE public.user_donations 
        RENAME COLUMN package_id TO donation_package_id;
    END IF;
END $$;

-- 2. Adicionar colunas que podem estar faltando no schema do usuário
DO $$
BEGIN
    -- Adicionar mercado_pago_preference_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_donations'
        AND column_name = 'mercado_pago_preference_id'
    ) THEN
        ALTER TABLE public.user_donations 
        ADD COLUMN mercado_pago_preference_id VARCHAR(255);
    END IF;
    
    -- Adicionar mercado_pago_external_reference se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_donations'
        AND column_name = 'mercado_pago_external_reference'
    ) THEN
        ALTER TABLE public.user_donations 
        ADD COLUMN mercado_pago_external_reference VARCHAR(255);
    END IF;
    
    -- Adicionar questions_used se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_donations'
        AND column_name = 'questions_used'
    ) THEN
        ALTER TABLE public.user_donations 
        ADD COLUMN questions_used INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Adicionar metadata se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_donations'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.user_donations 
        ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Criar função create_donation se não existir
CREATE OR REPLACE FUNCTION public.create_donation(
    p_user_id UUID,
    p_donation_package_id UUID,
    p_payment_method VARCHAR,
    p_payment_provider VARCHAR DEFAULT 'mercado_pago'
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
    WHERE id = p_donation_package_id AND is_active = true;
    
    IF v_package IS NULL THEN
        RAISE EXCEPTION 'Package not found or inactive';
    END IF;
    
    -- Criar doação
    INSERT INTO public.user_donations (
        user_id,
        donation_package_id,
        amount,
        questions_added,
        payment_method,
        payment_provider,
        payment_status,
        questions_used
    ) VALUES (
        p_user_id,
        p_donation_package_id,
        v_package.price,
        v_package.questions_added,
        p_payment_method,
        p_payment_provider,
        'pending',
        0
    )
    RETURNING id INTO v_donation_id;
    
    RETURN v_donation_id;
END;
$$;

-- 4. Criar função process_completed_donation (compatível com schema do usuário)
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
    WHERE id = p_donation_id AND payment_status = 'completed';
    
    IF v_donation IS NULL THEN
        RETURN false;
    END IF;
    
    -- Usar a função do usuário para adicionar perguntas
    RETURN public.add_questions_from_donation(v_donation.user_id, p_donation_id);
END;
$$;

-- 5. Garantir que get_user_total_available_questions funcione com o schema
CREATE OR REPLACE FUNCTION public.get_user_total_available_questions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_daily_remaining INTEGER;
    v_bonus_total INTEGER;
    v_is_admin BOOLEAN;
    v_max_questions INTEGER;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF v_is_admin THEN
        RETURN -1; -- Ilimitado
    END IF;

    -- Perguntas diárias restantes
    SELECT 
        GREATEST(0, max_questions - question_count),
        max_questions
    INTO v_daily_remaining, v_max_questions
    FROM public.user_question_limits
    WHERE user_id = p_user_id AND limit_date = CURRENT_DATE;
    
    IF v_daily_remaining IS NULL THEN
        v_daily_remaining := 50;
        v_max_questions := 50;
    END IF;
    
    -- Calcular perguntas bonus do max_questions (acima de 50)
    v_bonus_total := GREATEST(0, v_max_questions - 50);
    
    RETURN v_daily_remaining + v_bonus_total;
END;
$$;

-- 6. Garantir permissões
GRANT EXECUTE ON FUNCTION public.create_donation(UUID, UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_completed_donation(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_total_available_questions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_questions_from_donation(UUID, UUID) TO authenticated;

-- 7. Atualizar pacotes se necessário (garantir nomes consistentes)
UPDATE public.donation_packages 
SET name = 'Pacote Bronze', description = 'R$ 5,00 = +30 perguntas'
WHERE price = 5.00 AND name = 'Starter';

UPDATE public.donation_packages 
SET name = 'Pacote Prata', description = 'R$ 10,00 = +70 perguntas'
WHERE price = 10.00 AND name = 'Básico';

UPDATE public.donation_packages 
SET name = 'Pacote Ouro', description = 'R$ 20,00 = +150 perguntas'
WHERE price = 20.00 AND name = 'Intermediário';

UPDATE public.donation_packages 
SET name = 'Pacote Diamante', description = 'R$ 50,00 = +400 perguntas'
WHERE price = 50.00 AND name = 'Avançado';

UPDATE public.donation_packages 
SET name = 'Pacote Premium', description = 'R$ 100,00 = +1000 perguntas'
WHERE price = 100.00 AND name = 'Premium';

-- 8. Adicionar colunas visuais se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'donation_packages'
        AND column_name = 'card_color'
    ) THEN
        ALTER TABLE public.donation_packages 
        ADD COLUMN card_color VARCHAR(20) DEFAULT 'emerald';
        
        -- Atualizar cores baseadas no preço
        UPDATE public.donation_packages SET card_color = 'amber' WHERE price = 5.00;
        UPDATE public.donation_packages SET card_color = 'slate' WHERE price = 10.00;
        UPDATE public.donation_packages SET card_color = 'yellow' WHERE price = 20.00;
        UPDATE public.donation_packages SET card_color = 'emerald' WHERE price = 50.00;
        UPDATE public.donation_packages SET card_color = 'purple' WHERE price = 100.00;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'donation_packages'
        AND column_name = 'icon'
    ) THEN
        ALTER TABLE public.donation_packages 
        ADD COLUMN icon VARCHAR(50) DEFAULT 'gift';
        
        -- Atualizar ícones
        UPDATE public.donation_packages SET icon = 'message-circle' WHERE price = 5.00;
        UPDATE public.donation_packages SET icon = 'message-square' WHERE price = 10.00;
        UPDATE public.donation_packages SET icon = 'sparkles' WHERE price = 20.00;
        UPDATE public.donation_packages SET icon = 'crown' WHERE price = 50.00;
        UPDATE public.donation_packages SET icon = 'heart' WHERE price = 100.00;
    END IF;
END $$;

-- Verificação final
SELECT 'Migração concluída! Sistema de doações alinhado.' AS status;
