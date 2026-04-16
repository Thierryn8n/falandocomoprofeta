-- =====================================================
-- SISTEMA PIX DIRETO COM ANÁLISE DE COMPROVANTE POR IA
-- =====================================================
-- Cria tabelas para: configurações PIX, análise de comprovantes, anti-fraude

-- =====================================================
-- 1. TABELA: Configurações PIX do Admin
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pix_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pix_key TEXT NOT NULL,
    pix_key_type TEXT NOT NULL DEFAULT 'random', -- cpf, cnpj, email, phone, random
    beneficiary_name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    instructions TEXT DEFAULT 'Após o pagamento, envie o comprovante para validação automática. O sistema analisará e liberará seu acesso em até 5 minutos.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_pix_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pix_settings ON public.pix_settings;
CREATE TRIGGER trigger_update_pix_settings
    BEFORE UPDATE ON public.pix_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_pix_settings_timestamp();

-- =====================================================
-- 2. TABELA: Análise de Comprovantes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.receipt_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES public.user_donations(id) ON DELETE CASCADE,
    receipt_url TEXT NOT NULL,
    extracted_data JSONB,
    confidence_score DECIMAL(3,2),
    fraud_score INTEGER,
    fraud_flags TEXT[],
    risk_level TEXT NOT NULL DEFAULT 'low', -- low, medium, high
    ai_raw_response TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, analyzing, approved, rejected, manual_review
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_receipt_analysis_donation ON public.receipt_analysis(donation_id);
CREATE INDEX IF NOT EXISTS idx_receipt_analysis_receipt_url ON public.receipt_analysis(receipt_url);
CREATE INDEX IF NOT EXISTS idx_receipt_analysis_status ON public.receipt_analysis(status);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_receipt_analysis ON public.receipt_analysis;
CREATE TRIGGER trigger_update_receipt_analysis
    BEFORE UPDATE ON public.receipt_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_pix_settings_timestamp();

-- =====================================================
-- 3. TABELA: Tentativas de Fraude
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fraud_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID REFERENCES public.user_donations(id) ON DELETE SET NULL,
    attempt_type TEXT NOT NULL, -- RECEIPT_REUSE, VALOR_INCORRETO, etc.
    details JSONB,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fraud_attempts_donation ON public.fraud_attempts(donation_id);
CREATE INDEX IF NOT EXISTS idx_fraud_attempts_type ON public.fraud_attempts(attempt_type);
CREATE INDEX IF NOT EXISTS idx_fraud_attempts_detected ON public.fraud_attempts(detected_at);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.pix_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas para pix_settings (apenas admin pode editar, todos podem ver se ativo)
CREATE POLICY "Anyone can view active PIX settings"
    ON public.pix_settings FOR SELECT
    USING (enabled = true);

CREATE POLICY "Only admins can manage PIX settings"
    ON public.pix_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para receipt_analysis
CREATE POLICY "Users can view own receipt analysis"
    ON public.receipt_analysis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_donations 
            WHERE id = receipt_analysis.donation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all receipt analysis"
    ON public.receipt_analysis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para fraud_attempts (apenas admin)
CREATE POLICY "Only admins can view fraud attempts"
    ON public.fraud_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can manage fraud attempts"
    ON public.fraud_attempts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 5. ATUALIZAR TABELA DONATIONS
-- =====================================================

-- Adicionar campos para PIX direto
ALTER TABLE public.user_donations 
ADD COLUMN IF NOT EXISTS pix_key_used TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL';

-- Atualizar payment_method para permitir 'pix_direct'
ALTER TABLE public.user_donations 
ALTER COLUMN payment_method TYPE VARCHAR(50);

-- =====================================================
-- 6. FUNÇÃO: Verificar se comprovante já foi usado
-- =====================================================

CREATE OR REPLACE FUNCTION check_receipt_reuse(p_receipt_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.receipt_analysis
        WHERE receipt_url = p_receipt_url
        AND status IN ('approved', 'manual_review')
    ) INTO v_exists;
    
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION check_receipt_reuse(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_receipt_reuse(TEXT) TO service_role;

-- =====================================================
-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.pix_settings IS 'Configurações da chave PIX para doações diretas';
COMMENT ON TABLE public.receipt_analysis IS 'Análises de comprovantes PIX feitas por IA';
COMMENT ON TABLE public.fraud_attempts IS 'Log de tentativas de fraude detectadas';
COMMENT ON FUNCTION check_receipt_reuse(TEXT) IS 'Verifica se um comprovante já foi usado anteriormente';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Sistema PIX Direto criado com sucesso!' as status,
       'Tabelas: pix_settings, receipt_analysis, fraud_attempts' as tabelas;
