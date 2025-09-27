-- Script para atualizar tabela payment_transactions
-- Adiciona suporte melhorado para sistema interno vs externo do Abacate Pay

-- 1. Adicionar novas colunas se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna para indicar se é sistema interno ou externo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'is_external_system') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN is_external_system BOOLEAN DEFAULT false;
    END IF;

    -- Adicionar coluna para link de pagamento externo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'external_payment_link_id') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN external_payment_link_id UUID REFERENCES public.external_payment_links(id);
    END IF;

    -- Adicionar coluna para dados de configuração usados na transação
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'config_snapshot') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN config_snapshot JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Adicionar coluna para rastreamento de origem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'source') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN source TEXT DEFAULT 'internal' CHECK (source IN ('internal', 'external', 'webhook'));
    END IF;

    -- Adicionar coluna para dados do webhook (quando aplicável)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'webhook_data') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN webhook_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Atualizar constraint do payment_method para incluir novos tipos
ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN ('stripe', 'pix', 'manual', 'abacate_pay', 'abacate_pay_external'));

-- 3. Atualizar constraint do payment_status para incluir novos status
ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_status_check;

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_payment_status_check 
CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'processing', 'expired', 'cancelled'));

-- 4. Criar novos índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_is_external ON public.payment_transactions(is_external_system);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external_link_id ON public.payment_transactions(external_payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_source ON public.payment_transactions(source);
-- Nota: O índice para abacate_pay_external_id será criado no script 74.5-add-abacate-pay-columns.sql

-- 5. Criar função para validar dados de transação
CREATE OR REPLACE FUNCTION validate_payment_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é sistema externo, deve ter external_payment_link_id
    IF NEW.is_external_system = true AND NEW.external_payment_link_id IS NULL THEN
        RAISE EXCEPTION 'external_payment_link_id é obrigatório para transações do sistema externo';
    END IF;

    -- Se é Abacate Pay externo, deve ter link
    IF NEW.payment_method = 'abacate_pay_external' AND NEW.abacate_pay_link IS NULL THEN
        RAISE EXCEPTION 'abacate_pay_link é obrigatório para pagamentos externos do Abacate Pay';
    END IF;

    -- Se é sistema interno do Abacate Pay, deve ter tracking token
    IF NEW.payment_method = 'abacate_pay' AND NEW.is_external_system = false AND NEW.abacate_pay_tracking_token IS NULL THEN
        RAISE EXCEPTION 'abacate_pay_tracking_token é obrigatório para pagamentos internos do Abacate Pay';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para validação
DROP TRIGGER IF EXISTS validate_payment_transaction_trigger ON public.payment_transactions;
CREATE TRIGGER validate_payment_transaction_trigger
    BEFORE INSERT OR UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_payment_transaction();

-- 7. Atualizar comentários
COMMENT ON COLUMN public.payment_transactions.is_external_system IS 'true = sistema externo (links), false = sistema interno (processamento completo)';
COMMENT ON COLUMN public.payment_transactions.external_payment_link_id IS 'Referência ao link de pagamento externo usado';
COMMENT ON COLUMN public.payment_transactions.config_snapshot IS 'Snapshot das configurações do Abacate Pay no momento da transação';
COMMENT ON COLUMN public.payment_transactions.source IS 'Origem da transação: internal, external, webhook';
COMMENT ON COLUMN public.payment_transactions.webhook_data IS 'Dados recebidos via webhook (quando aplicável)';

-- 8. Criar view para estatísticas do dashboard
CREATE OR REPLACE VIEW public.abacate_pay_dashboard_stats AS
SELECT 
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE payment_status = 'completed') as completed_transactions,
    COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_transactions,
    COUNT(*) FILTER (WHERE is_external_system = true) as external_transactions,
    COUNT(*) FILTER (WHERE is_external_system = false) as internal_transactions,
    COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed'), 0) as total_revenue,
    COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed' AND created_at >= CURRENT_DATE), 0) as today_revenue,
    COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) as month_revenue,
    ROUND(
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE payment_status = 'completed')::decimal / COUNT(*)::decimal) * 100 
            ELSE 0 
        END, 2
    ) as conversion_rate
FROM public.payment_transactions 
WHERE payment_method IN ('abacate_pay', 'abacate_pay_external');

-- 9. Comentário na view
COMMENT ON VIEW public.abacate_pay_dashboard_stats IS 'Estatísticas do dashboard do Abacate Pay';