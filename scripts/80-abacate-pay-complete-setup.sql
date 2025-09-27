-- Script completo para configurar o Abacate Pay no Supabase
-- Execute este script inteiro no Supabase SQL Editor
-- Este script consolida todas as atualizações necessárias

BEGIN;

-- ========================================
-- 1. ADICIONAR COLUNAS DO ABACATE PAY
-- ========================================

-- Adicionar colunas do Abacate Pay se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna para link de pagamento do Abacate Pay
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'abacate_pay_link') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN abacate_pay_link TEXT;
    END IF;

    -- Adicionar coluna para token de rastreamento do Abacate Pay
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'abacate_pay_tracking_token') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN abacate_pay_tracking_token TEXT;
    END IF;

    -- Adicionar coluna para ID externo do Abacate Pay
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'abacate_pay_external_id') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN abacate_pay_external_id TEXT;
    END IF;
END $$;

-- Atualizar constraint do payment_method para incluir abacate_pay
ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN ('stripe', 'pix', 'manual', 'abacate_pay'));

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_link ON public.payment_transactions(abacate_pay_link);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_token ON public.payment_transactions(abacate_pay_tracking_token);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_external_id ON public.payment_transactions(abacate_pay_external_id);

-- ========================================
-- 2. CRIAR TABELA DE CONFIGURAÇÃO
-- ========================================

CREATE TABLE IF NOT EXISTS public.abacate_pay_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    api_url TEXT NOT NULL DEFAULT 'https://api.abacatepay.com',
    enabled BOOLEAN DEFAULT true,
    test_mode BOOLEAN DEFAULT true,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER DEFAULT 30000,
    retry_attempts INTEGER DEFAULT 3,
    purchase_link_template TEXT DEFAULT 'https://checkout.abacatepay.com/{product_id}',
    enable_purchase_links BOOLEAN DEFAULT true,
    enable_pix BOOLEAN DEFAULT true,
    pix_expiration_minutes INTEGER DEFAULT 30,
    use_external_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO public.abacate_pay_config (
    api_key,
    api_url,
    enabled,
    test_mode,
    webhook_url,
    webhook_secret,
    timeout,
    retry_attempts,
    purchase_link_template,
    enable_purchase_links,
    enable_pix,
    pix_expiration_minutes,
    use_external_system
) VALUES (
    'sua_api_key_aqui',
    'https://api.abacatepay.com',
    false,
    true,
    'https://seusite.com/api/webhook/abacate-pay',
    'seu_webhook_secret_aqui',
    30000,
    3,
    'https://checkout.abacatepay.com/{product_id}',
    true,
    true,
    30,
    false
) ON CONFLICT DO NOTHING;

-- ========================================
-- 3. CRIAR TABELA DE LINKS EXTERNOS
-- ========================================

CREATE TABLE IF NOT EXISTS public.external_payment_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    interval TEXT DEFAULT 'one_time' CHECK (interval IN ('monthly', 'yearly', 'one_time', 'custom')),
    features TEXT[] DEFAULT '{}',
    external_link TEXT NOT NULL,
    external_id TEXT,
    provider TEXT DEFAULT 'abacate_pay',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. ATUALIZAR TABELA DE TRANSAÇÕES
-- ========================================

-- Adicionar novas colunas para sistema interno vs externo
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'is_external_system') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN is_external_system BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'external_payment_link_id') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN external_payment_link_id UUID REFERENCES public.external_payment_links(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'config_snapshot') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN config_snapshot JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'source') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN source TEXT DEFAULT 'internal' CHECK (source IN ('internal', 'external', 'webhook'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'webhook_data') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN webhook_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Atualizar constraints
ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN ('stripe', 'pix', 'manual', 'abacate_pay', 'abacate_pay_external'));

ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_status_check;

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_payment_status_check 
CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'processing', 'expired', 'cancelled'));

-- ========================================
-- 5. CRIAR TABELA DE PRODUTOS APRIMORADA
-- ========================================

CREATE TABLE IF NOT EXISTS public.abacate_pay_products_enhanced (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    plan_type TEXT DEFAULT 'one_time' CHECK (plan_type IN ('monthly', 'yearly', 'one_time', 'custom')),
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    internal_config JSONB DEFAULT '{}'::jsonb,
    external_link TEXT,
    external_config JSONB DEFAULT '{}'::jsonb,
    ui_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. CRIAR FUNÇÕES AUXILIARES
-- ========================================

-- Função para obter configuração ativa
CREATE OR REPLACE FUNCTION get_active_abacate_pay_config()
RETURNS TABLE (
    api_key TEXT,
    api_url TEXT,
    enabled BOOLEAN,
    test_mode BOOLEAN,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER,
    retry_attempts INTEGER,
    purchase_link_template TEXT,
    enable_purchase_links BOOLEAN,
    enable_pix BOOLEAN,
    pix_expiration_minutes INTEGER,
    use_external_system BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.api_key,
        c.api_url,
        c.enabled,
        c.test_mode,
        c.webhook_url,
        c.webhook_secret,
        c.timeout,
        c.retry_attempts,
        c.purchase_link_template,
        c.enable_purchase_links,
        c.enable_pix,
        c.pix_expiration_minutes,
        c.use_external_system
    FROM public.abacate_pay_config c
    ORDER BY c.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_abacate_pay_dashboard_stats()
RETURNS TABLE (
    total_revenue DECIMAL,
    total_transactions BIGINT,
    active_products BIGINT,
    active_external_links BIGINT,
    conversion_rate DECIMAL,
    today_revenue DECIMAL,
    monthly_growth DECIMAL,
    pending_transactions BIGINT,
    completed_transactions BIGINT,
    failed_transactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed'), 0) as total_rev,
            COUNT(*) as total_trans,
            COUNT(*) FILTER (WHERE pt.payment_status = 'pending') as pending_trans,
            COUNT(*) FILTER (WHERE pt.payment_status = 'completed') as completed_trans,
            COUNT(*) FILTER (WHERE pt.payment_status = 'failed') as failed_trans,
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed' AND pt.created_at >= CURRENT_DATE), 0) as today_rev,
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed' AND pt.created_at >= date_trunc('month', CURRENT_DATE)), 0) as current_month_rev,
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed' AND pt.created_at >= date_trunc('month', CURRENT_DATE - interval '1 month') AND pt.created_at < date_trunc('month', CURRENT_DATE)), 0) as last_month_rev
        FROM public.payment_transactions pt
        WHERE pt.payment_method IN ('abacate_pay', 'abacate_pay_external')
    ),
    products_count AS (
        SELECT COUNT(*) as active_prod
        FROM public.abacate_pay_products_enhanced
        WHERE is_active = true
    ),
    links_count AS (
        SELECT COUNT(*) as active_links
        FROM public.external_payment_links
        WHERE status = 'active'
    )
    SELECT 
        s.total_rev,
        s.total_trans,
        pc.active_prod,
        lc.active_links,
        CASE 
            WHEN s.total_trans > 0 THEN 
                ROUND((s.completed_trans::decimal / s.total_trans::decimal) * 100, 2)
            ELSE 0 
        END,
        s.today_rev,
        CASE 
            WHEN s.last_month_rev > 0 THEN 
                ROUND(((s.current_month_rev - s.last_month_rev) / s.last_month_rev) * 100, 2)
            ELSE 0 
        END,
        s.pending_trans,
        s.completed_trans,
        s.failed_trans
    FROM stats s
    CROSS JOIN products_count pc
    CROSS JOIN links_count lc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter opções de pagamento
CREATE OR REPLACE FUNCTION get_available_payment_options()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    currency TEXT,
    plan_type TEXT,
    features TEXT[],
    is_featured BOOLEAN,
    sort_order INTEGER,
    payment_link TEXT,
    ui_config JSONB,
    system_type TEXT
) AS $$
DECLARE
    config_rec RECORD;
BEGIN
    SELECT * INTO config_rec FROM get_active_abacate_pay_config() LIMIT 1;
    
    IF config_rec.use_external_system THEN
        RETURN QUERY
        SELECT 
            epl.id,
            epl.name,
            epl.description,
            epl.price,
            epl.currency,
            epl.interval as plan_type,
            epl.features,
            (epl.metadata->>'highlight')::boolean as is_featured,
            epl.sort_order,
            epl.external_link as payment_link,
            epl.metadata as ui_config,
            'external'::text as system_type
        FROM public.external_payment_links epl
        WHERE epl.status = 'active'
        ORDER BY epl.sort_order ASC;
    ELSE
        RETURN QUERY
        SELECT 
            ape.id,
            ape.name,
            ape.description,
            ape.price,
            ape.currency,
            ape.plan_type,
            ape.features,
            ape.is_featured,
            ape.sort_order,
            ape.external_link as payment_link,
            ape.ui_config,
            'internal'::text as system_type
        FROM public.abacate_pay_products_enhanced ape
        WHERE ape.is_active = true
        ORDER BY ape.sort_order ASC, ape.is_featured DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. CONFIGURAR PERMISSÕES E RLS
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.abacate_pay_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abacate_pay_products_enhanced ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes e recriar para abacate_pay_config
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.abacate_pay_config;
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.abacate_pay_config;

CREATE POLICY "Allow read access for authenticated users" ON public.abacate_pay_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for service_role" ON public.abacate_pay_config
    FOR ALL USING (auth.role() = 'service_role');

-- Remover políticas existentes e recriar para external_payment_links
DROP POLICY IF EXISTS "Allow read access for all" ON public.external_payment_links;
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.external_payment_links;

CREATE POLICY "Allow read access for all" ON public.external_payment_links
    FOR SELECT USING (true);

CREATE POLICY "Allow all operations for service_role" ON public.external_payment_links
    FOR ALL USING (auth.role() = 'service_role');

-- Remover políticas existentes e recriar para abacate_pay_products_enhanced
DROP POLICY IF EXISTS "Allow read access for active products" ON public.abacate_pay_products_enhanced;
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.abacate_pay_products_enhanced;

CREATE POLICY "Allow read access for active products" ON public.abacate_pay_products_enhanced
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow all operations for service_role" ON public.abacate_pay_products_enhanced
    FOR ALL USING (auth.role() = 'service_role');

-- Permissões para funções
GRANT EXECUTE ON FUNCTION get_active_abacate_pay_config() TO authenticated;
GRANT EXECUTE ON FUNCTION get_abacate_pay_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_payment_options() TO authenticated;

-- ========================================
-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_payment_transactions_is_external ON public.payment_transactions(is_external_system);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external_link_id ON public.payment_transactions(external_payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_source ON public.payment_transactions(source);
CREATE INDEX IF NOT EXISTS idx_abacate_pay_config_enabled ON public.abacate_pay_config(enabled);
CREATE INDEX IF NOT EXISTS idx_abacate_pay_config_use_external ON public.abacate_pay_config(use_external_system);
CREATE INDEX IF NOT EXISTS idx_external_payment_links_status ON public.external_payment_links(status);
CREATE INDEX IF NOT EXISTS idx_abacate_products_enhanced_active ON public.abacate_pay_products_enhanced(is_active);

COMMIT;

-- Mensagem de sucesso
SELECT 'Setup completo do Abacate Pay aplicado com sucesso!' as message;